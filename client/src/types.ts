export interface RoomImage {
  roomName: string;
  imageUrl: string;
}

export interface ChatEntry {
  id: string;
  prompt: string;
  originalImage: string;
  results: RoomImage[];
  timestamp: Date;
}
