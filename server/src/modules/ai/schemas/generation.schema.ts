import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type GenerationDocument = HydratedDocument<Generation>;

@Schema()
export class GeneratedRoom {
  @Prop({ required: true })
  roomName: string;

  @Prop({ required: true })
  imageUrl: string;
}

export const GeneratedRoomSchema = SchemaFactory.createForClass(GeneratedRoom);

@Schema({ timestamps: true, collection: 'generations' })
export class Generation {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  prompt: string;

  @Prop({ required: true })
  originalImage: string;

  @Prop({ type: [GeneratedRoomSchema], default: [] })
  generatedRooms: GeneratedRoom[];

  @Prop({ default: () => new Date() })
  createdAt: Date;
}

export const GenerationSchema = SchemaFactory.createForClass(Generation);
