import { DataSource, DataSourceOptions } from "typeorm";
import { config } from "../../config";
import { User } from "../entities/user.entity";
import { Member } from "../entities/member.entity";
import { InitSchema1688000000000 } from "./migrations/1688000000000-InitSchema";
import { ExtendMembersSchema1688100000000 } from "./migrations/1688100000000-ExtendMembersSchema";
import { AddPackageColumn1688200000000 } from "./migrations/1688200000000-AddPackageColumn";

const dbUrl = process.env.DATABASE_URL;
const isProd = process.env.NODE_ENV === "production";
const useSsl = process.env.DB_SSL === "true" || (isProd && !process.env.DB_SSL);

const dataSourceOptions: DataSourceOptions = dbUrl
  ? {
      type: "postgres",
      url: dbUrl,
      ssl: process.env.DB_SSL === "false" ? false : { rejectUnauthorized: false },
      synchronize: false,
      logging: false,
      entities: [User, Member],
      migrations: [InitSchema1688000000000, ExtendMembersSchema1688100000000, AddPackageColumn1688200000000],
      subscribers: []
    }
  : {
      type: "postgres",
      host: config.database.host,
      port: config.database.port,
      username: config.database.username,
      password: config.database.password,
      database: config.database.database,
      ssl: useSsl ? { rejectUnauthorized: false } : false,
      synchronize: false,
      logging: false,
      entities: [User, Member],
      migrations: [InitSchema1688000000000, ExtendMembersSchema1688100000000, AddPackageColumn1688200000000],
      subscribers: []
    };

export const AppDataSource = new DataSource(dataSourceOptions);
