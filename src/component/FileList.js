import React, { useEffect, useState } from 'react';
// import axios from 'axios';
import axios from '../axiosConfig';
import { saveAs } from 'file-saver';  // Import FileSaver.js
const baseUrl = "http://localhost:5000";
// const baseUrl = "https://kms-lm-list.vercel.app";

function FileList() {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await axios.get(`/api/files`);
        setFiles(response.data.files);
      } catch (err) {
        setError('Error fetching files');
      }
    };

    fetchFiles();
  }, []);

  const deleteFile = async (fileName) => {
    try {
      // await axios.delete(`http://localhost:5000/api/delete-file/${fileName}`);
      await axios.delete(`/api/delete-file/${fileName}`);
      setFiles(files.filter(file => file !== fileName));
    } catch (err) {
      setError('Error deleting file');
    }
  };

  const exportFile = async (fileName) => {
    try {
      // Fetch the file data
      // const response = await axios.get(`http://localhost:5000/api/file/data/${fileName}`);
      const response = await axios.get(`/api/file/data/${fileName}`);
      const fileData = response.data.members;
      const headers = response.data.headers;

      // Convert the data to XLSX format
      const ws = XLSX.utils.json_to_sheet(fileData, { header: headers });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

      // Generate the file content
      const fileContent = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

      // Create a Blob for the file content
      const blob = new Blob([fileContent], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      // Prompt user to save the file with a custom name
      const defaultFileName = fileName.split('.')[0]; // Extract name without extension
      const fileToSave = new File([blob], `${defaultFileName}_exported.xlsx`, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      // Use FileSaver to save the file
      saveAs(fileToSave);
    } catch (err) {
      console.error('Error exporting file:', err);
    }
  };

  return (
    <div>
      <h3>Uploaded Files</h3>
      {error && <p>{error}</p>}
      <ul>
        {files.map((file, index) => (
          <li key={index}>
            {file}
            <button onClick={() => deleteFile(file)}>Delete</button>
            <button onClick={() => exportFile(file)}>Export</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FileList;
