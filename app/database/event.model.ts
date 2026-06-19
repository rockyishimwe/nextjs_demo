import { Schema,model,models,Document }  from "mongoose";
//Typescript interface for Event document
export interface IEvent extends Document {
    title:string;
    slug:string;
    description:string;
    overview:string;
    image:string;
    venue:string;
    location:string;
    date:string;
    time:string;
    mode:string;
    audience:string;
    agenda:string;
    organizer:string[];
    tags:string[];
    createdAt:Date;
    updatedAt:Date;
}
const EventSchema = new Schema<IEvent>(
    {
        title:{
            type:String,
            required:[true,'Title is required'],
            trim:true,
            maxLength:[100,'Title cannot exceed 100 characters'],
        },
        slug: {
            type:String,
            unique:true,
            lowercase:true,
            trim:true,
        },
        description:{
            type:String,
            required:[true,'Description cannot 1000 characters'],
        },
    }
)
