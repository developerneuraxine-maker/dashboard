import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const isFallback =
  !supabaseUrl ||
  !supabaseServiceKey ||
  supabaseUrl.includes("your-supabase-project") ||
  supabaseServiceKey.includes("your-supabase-service-role-key");

function getDbFile() {
  if (typeof window !== "undefined" || process.env.NEXT_RUNTIME === "edge") {
    return null;
  }
  const path = require("path");
  const p = typeof process !== "undefined" ? process : null;
  const cwd = p && typeof p === "object" ? (p as any)["cwd"] : null;
  if (typeof cwd !== "function") return null;
  return path.join(cwd.call(p), "db_fallback.json");
}

function readDb(): any {
  if (typeof window !== "undefined" || process.env.NEXT_RUNTIME === "edge") {
    return {
      User: [],
      Attendance: [],
      Task: [],
      DailyReport: [],
      ActivityLog: [],
      Notification: [],
    };
  }
  const fs = require("fs");
  const dbFile = getDbFile();
  if (!dbFile) return {};

  if (!fs.existsSync(dbFile)) {
    const initial = {
      User: [],
      Attendance: [],
      Task: [],
      DailyReport: [],
      ActivityLog: [],
      Notification: [],
    };
    fs.writeFileSync(dbFile, JSON.stringify(initial, null, 2));
    return initial;
  }
  try {
    const content = fs.readFileSync(dbFile, "utf-8");
    return JSON.parse(content);
  } catch (err) {
    console.error("Failed to read JSON DB fallback:", err);
    return {
      User: [],
      Attendance: [],
      Task: [],
      DailyReport: [],
      ActivityLog: [],
      Notification: [],
    };
  }
}

function writeDb(data: any) {
  if (typeof window !== "undefined" || process.env.NEXT_RUNTIME === "edge") {
    return;
  }
  const fs = require("fs");
  const dbFile = getDbFile();
  if (!dbFile) return;
  try {
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Failed to write to JSON DB fallback:", err);
  }
}

class MockQueryBuilder {
  private tableName: string;
  private filters: Array<(item: any) => boolean> = [];
  private orderField: string | null = null;
  private orderAscending = true;
  private limitCount: number | null = null;
  private isSingle = false;
  private isMaybeSingle = false;
  private operation: "select" | "insert" | "update" | "delete" = "select";
  private operationData: any = null;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(columns?: string) {
    if (this.operation === "select") {
      this.operation = "select";
    }
    return this;
  }

  insert(data: any) {
    this.operation = "insert";
    this.operationData = data;
    return this;
  }

  update(data: any) {
    this.operation = "update";
    this.operationData = data;
    return this;
  }

  delete() {
    this.operation = "delete";
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push((item) => item[column] === value);
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push((item) => item[column] !== value);
    return this;
  }

  gte(column: string, value: any) {
    this.filters.push((item) => {
      if (item[column] == null) return false;
      return item[column] >= value;
    });
    return this;
  }

  lte(column: string, value: any) {
    this.filters.push((item) => {
      if (item[column] == null) return false;
      return item[column] <= value;
    });
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push((item) => values.includes(item[column]));
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderField = column;
    this.orderAscending = options?.ascending ?? true;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  async execute() {
    const db = readDb();
    if (!db[this.tableName]) {
      db[this.tableName] = [];
    }

    const list = db[this.tableName];

    if (this.operation === "select") {
      let filtered = list.filter((item: any) => {
        for (const filter of this.filters) {
          if (!filter(item)) return false;
        }
        return true;
      });

      if (this.orderField) {
        filtered.sort((a: any, b: any) => {
          const valA = a[this.orderField!];
          const valB = b[this.orderField!];
          if (valA == null && valB == null) return 0;
          if (valA == null) return this.orderAscending ? -1 : 1;
          if (valB == null) return this.orderAscending ? 1 : -1;
          if (valA < valB) return this.orderAscending ? -1 : 1;
          if (valA > valB) return this.orderAscending ? 1 : -1;
          return 0;
        });
      }

      if (this.limitCount !== null) {
        filtered = filtered.slice(0, this.limitCount);
      }

      if (this.isSingle) {
        if (filtered.length === 0) {
          return { data: null, error: { message: `No rows found in ${this.tableName}` } };
        }
        return { data: filtered[0], error: null };
      }

      if (this.isMaybeSingle) {
        if (filtered.length === 0) {
          return { data: null, error: null };
        }
        return { data: filtered[0], error: null };
      }

      return { data: filtered, error: null };
    }

    if (this.operation === "insert") {
      const dataToInsert = Array.isArray(this.operationData)
        ? this.operationData
        : [this.operationData];

      const inserted: any[] = [];
      for (const item of dataToInsert) {
        const itemCopy = { ...item };
        list.push(itemCopy);
        inserted.push(itemCopy);
      }

      db[this.tableName] = list;
      writeDb(db);

      const returned = Array.isArray(this.operationData) ? inserted : inserted[0];
      return { data: returned, error: null };
    }

    if (this.operation === "update") {
      const indicesToUpdate: number[] = [];
      const updatedItems: any[] = [];

      for (let i = 0; i < list.length; i++) {
        let match = true;
        for (const filter of this.filters) {
          if (!filter(list[i])) {
            match = false;
            break;
          }
        }
        if (match) {
          indicesToUpdate.push(i);
        }
      }

      for (const idx of indicesToUpdate) {
        list[idx] = { ...list[idx], ...this.operationData };
        updatedItems.push(list[idx]);
      }

      db[this.tableName] = list;
      writeDb(db);

      if (this.isSingle || this.isMaybeSingle) {
        return { data: updatedItems[0] || null, error: null };
      }

      return { data: updatedItems, error: null };
    }

    if (this.operation === "delete") {
      const remaining: any[] = [];
      for (const item of list) {
        let match = true;
        for (const filter of this.filters) {
          if (!filter(item)) {
            match = false;
            break;
          }
        }
        if (!match) {
          remaining.push(item);
        }
      }

      db[this.tableName] = remaining;
      writeDb(db);

      return { data: null, error: null };
    }

    return { data: null, error: { message: "Unsupported mock operation" } };
  }

  async then(resolve: any, reject?: any) {
    try {
      const res = await this.execute();
      return resolve(res);
    } catch (err) {
      if (reject) return reject(err);
      throw err;
    }
  }
}

export const supabase = isFallback
  ? ({
      from(tableName: string) {
        return new MockQueryBuilder(tableName);
      },
    } as any)
  : createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

