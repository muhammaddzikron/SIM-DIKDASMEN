export const DEFAULT_DRIVE_FOLDER_ID = '1oCiDvh8jdjXeoiXwEcJlNiH25Hh_64Y4';

export async function uploadFileToDrive(
  accessToken: string,
  folderId: string,
  file: File
): Promise<{ fileId: string; fileUrl: string }> {
  const metadata = {
    name: file.name,
    parents: folderId ? [folderId] : [],
  };

  const boundary = 'foo_bar_boundary';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const fileContentPromise = new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      resolve(binary);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });

  const binaryContent = await fileContentPromise;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${file.type || 'application/octet-stream'}\r\n` +
    'Content-Transfer-Encoding: base64\r\n\r\n' +
    btoa(binaryContent) +
    closeDelimiter;

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Drive upload failed. Status: ${response.status}`);
  }

  const resData = await response.json();
  const fileId = resData.id;
  const fileUrl = `https://drive.google.com/file/d/${fileId}/view?usp=drivesdk`;

  return { fileId, fileUrl };
}
