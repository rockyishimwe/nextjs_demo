import mongoose, { mongo } from "mongoose";
//define the connection cache type
type MongooseCache = {
    conn:typeof mongoose | null;
    promise:Promise<typeof mongoose > | null;
};