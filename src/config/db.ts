import 'dotenv/config'
import { DataSource } from "typeorm";
import { Users } from "../entity/user.entity";
import { TreeRecord } from "../entity/tree-record.entity";

const AppDataSource = new DataSource({
    type: 'postgres',
    url: process.env.DB_STR,
    entities: [
        Users, TreeRecord
    ],
    synchronize: true,
    logging: true,
    ssl: {
        rejectUnauthorized: false
    }
});

export default AppDataSource;