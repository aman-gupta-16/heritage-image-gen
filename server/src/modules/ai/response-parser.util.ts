export function parseAiResponse(response: any): {
  roomName: string;
  imageBase64: string;
}[] {
  const rooms: { roomName: string; imageBase64: string }[] = [];

  const candidates = response?.candidates ?? [];

  let currentLabel = 'Room';

  for (const candidate of candidates) {
    const parts = candidate?.content?.parts ?? [];

    for (const part of parts) {
      if (part.text) {
        const cleaned = part.text.trim().replace(/[:\n]/g, '');
        if (cleaned) {
          currentLabel = cleaned;
        }
      }

      if (part.inlineData?.data) {
        rooms.push({
          roomName: currentLabel || `Room ${rooms.length + 1}`,
          imageBase64: part.inlineData.data,
        });

        currentLabel = `Room ${rooms.length + 1}`;
      }
    }
  }

  return rooms;
}
