import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import ReactDOMServer from 'react-dom/server';

const HtmlTemplate = ({ senderData, mailData, row }) => (
  <div>
    <h1>Email Template</h1>
    <p>To: {mailData.to}</p>
    <p>From: {mailData.from}</p>
    <p>Subject: {mailData.subject}</p>
    <p>Message: {mailData.message}</p>
    <p>Member: {row?.NAME}</p>
  </div>
);

function App() {
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingRowIndex, setEditingRowIndex] = useState(null); // Changed to store index only
  const [editedData, setEditedData] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileOptions, setFileOptions] = useState([]);
  const [fileName, setFileName] = useState("");
  const [sortWithAddress, setSortWithAddress] = useState("");
  const [toggleFileOptions, setToggleFileOptions] = useState("hidden");
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [isMailModalOpen, setIsMailModalOpen] = useState(false);
  const [mailForm, setMailForm] = useState({
    to: "",
    from: "",
    date: "",
    message: "",
    attachment: "",
    subject: "",
    member: "",
    htmlContent: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const [mailRowData, setMailRowData] = useState(null); // Added for mail form

  useEffect(() => {
    const storedFiles = localStorage.getItem('excelFiles');
    if (storedFiles) {
      setFileOptions(JSON.parse(storedFiles));
    }
  }, []);

  function convertExcelDate(serial) {
    if (isNaN(serial)) return serial;
    const date = new Date((serial - 25569) * 86400 * 1000);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  function handleFileUpload(event) {
    const uploadedFile = event.target.files[0];
    if (!uploadedFile) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const data = e.target.result;
        const wb = XLSX.read(data, { type: 'binary' });

        const sheet = wb.Sheets[wb.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        const headers = jsonData[0];
        const rows = jsonData.slice(1).map((row) => {
          let obj = {};
          headers.forEach((header, index) => {
            let value = row[index] || '';
            if (header && header.toString().includes('DOB')) {
              value = value ? convertExcelDate(value) : '';
            }
            obj[header] = value;
          });
          return obj;
        });

        const fileData = {
          fileName: uploadedFile.name,
          headers: headers,
          data: rows
        };

        const existingFiles = JSON.parse(localStorage.getItem('excelFiles')) || [];
        const existingIndex = existingFiles.findIndex(f => f.fileName === uploadedFile.name);
        
        if (existingIndex >= 0) {
          existingFiles[existingIndex] = fileData;
          Swal.fire('Updated!', 'File has been updated.', 'success');
        } else {
          existingFiles.push(fileData);
          Swal.fire('Success!', 'File has been uploaded.', 'success');
        }

        localStorage.setItem('excelFiles', JSON.stringify(existingFiles));
        setFileOptions(existingFiles);
        setFileName(uploadedFile.name);
        setHeaders(headers);
        setData(rows);
      } catch (error) {
        Swal.fire('Error!', 'Failed to process the file.', 'error');
        console.error("File processing error:", error);
      }
    };
    reader.readAsBinaryString(uploadedFile);
  }

  const handleDeleteFile = async (fileName) => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: `Do you really want to delete the file: ${fileName}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'No, keep it',
        reverseButtons: true,
      });

      if (result.isConfirmed) {
        const existingFiles = JSON.parse(localStorage.getItem('excelFiles')) || [];
        const updatedFiles = existingFiles.filter(f => f.fileName !== fileName);
        
        localStorage.setItem('excelFiles', JSON.stringify(updatedFiles));
        setFileOptions(updatedFiles);
        
        if (fileName === fileName) {
          setData([]);
          setHeaders([]);
          setFileName("");
        }
        
        Swal.fire('Deleted!', 'The file has been deleted.', 'success');
      } else {
        Swal.fire('Cancelled', 'The file was not deleted.', 'info');
      }
    } catch (error) {
      Swal.fire('Error!', 'There was an issue deleting the file.', 'error');
    }
  };

  const handleExportFile = (fileName) => {
    try {
      setToggleFileOptions("hidden");
      
      const fileData = fileOptions.find(f => f.fileName === fileName);
      if (!fileData) {
        Swal.fire('Error!', 'File not found.', 'error');
        return;
      }
      
      const exportData = [fileData.headers, ...fileData.data.map(row => {
        return fileData.headers.map(header => row[header] || '');
      })];
      
      const ws = XLSX.utils.aoa_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error("Error exporting file:", error);
      Swal.fire('Error!', 'There was an issue exporting the file.', 'error');
    }
  };

  function selectFileHandler(fileName) {
    setFileName(fileName);
    setToggleFileOptions("hidden");
    
    const fileData = fileOptions.find(f => f.fileName === fileName);
    if (fileData) {
      setData(fileData.data);
      setHeaders(fileData.headers);
    }
  }

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: `Do you really want to update member: ${editedData.NAME}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, update it!',
        cancelButtonText: 'No, keep it',
        reverseButtons: true,
      });

      if (result.isConfirmed) {
        // Create a new array with the updated data at the correct index
        const updatedData = [...data];
        updatedData[editingRowIndex] = editedData;

        const existingFiles = JSON.parse(localStorage.getItem('excelFiles')) || [];
        const fileIndex = existingFiles.findIndex(f => f.fileName === fileName);
        
        if (fileIndex >= 0) {
          const updatedFiles = [...existingFiles];
          updatedFiles[fileIndex] = {
            ...existingFiles[fileIndex],
            data: updatedData
          };
          
          localStorage.setItem('excelFiles', JSON.stringify(updatedFiles));
          setFileOptions(updatedFiles);
          setData(updatedData);
          
          Swal.fire('Updated!', 'The Member has been updated.', 'success');
          setIsModalOpen(false);
          setEditingRowIndex(null);
          setEditedData({});
        }
      } else {
        Swal.fire('Cancelled', 'The Member was not updated.', 'info');
      }
    } catch (error) {
      console.error("Error updating data:", error);
      Swal.fire('Error!', 'There was an issue updating the data.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (e) => {
    const { name, value } = e;
    setEditedData((prev) => ({ ...prev, [name]: value }));
  };

  const deleteMemberFun = async (memberNumber, memberName) => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: `Do you really want to delete member: ${memberName}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'No, keep it',
        reverseButtons: true,
      });

      if (result.isConfirmed) {
        const dataAfterDelete = data.filter(v => v.MEMBER !== memberNumber);

        const existingFiles = JSON.parse(localStorage.getItem('excelFiles')) || [];
        const fileIndex = existingFiles.findIndex(f => f.fileName === fileName);
        
        if (fileIndex >= 0) {
          existingFiles[fileIndex].data = dataAfterDelete;
          localStorage.setItem('excelFiles', JSON.stringify(existingFiles));
          setFileOptions(existingFiles);
          setData(dataAfterDelete);
          
          Swal.fire('Deleted!', 'The Member has been deleted.', 'success');
        }
      } else {
        Swal.fire('Cancelled', 'The Member was not deleted.', 'info');
      }
    } catch (error) {
      Swal.fire('Error!', 'There was an issue deleting the Member.', 'error');
      console.error("Error deleting member:", error);
    }
  };

  const toggleMailForm = (row) => {
    setMailForm({
      to: row.EMAIL || "",
      from: "",
      message: "",
      attachment: "",
      subject: "",
      member: row.MEMBER || "",
      htmlContent: ""
    });
    setMailRowData(row); // Use separate state for mail row data
    setIsMailModalOpen(true);
  }

  const submitMail = () => {
    const htmlContent = ReactDOMServer.renderToStaticMarkup(
      <HtmlTemplate senderData={editedData} mailData={mailForm} row={mailRowData} />
    );
    
    console.log("Email would be sent with:", {
      ...mailForm,
      htmlContent
    });
    
    Swal.fire('Info', 'In a real application, this would send the email.', 'info');
    setIsMailModalOpen(false);
  }

  const handleMailFormChange = (e) => {
    const {name, value} = e;
    setMailForm({...mailForm, [name]: value});
  }

  const paginatedDataOne = useMemo(() => {
    if (data.length > 0) {
      let filtered = data.filter((row) => {
        return Object.values(row).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );
      });

      const totalPages = Math.ceil(filtered.length / rowsPerPage);
      if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(totalPages);
      }

      if (sortWithAddress) {
        const sortKey = sortWithAddress.split("-")[0];
        const sortOrder = sortWithAddress.split("-")[1];

        filtered.sort((a, b) => {
          const aValue = a[sortKey];
          const bValue = b[sortKey];

          const aIsNumber = !isNaN(aValue) && aValue !== null && aValue !== '';
          const bIsNumber = !isNaN(bValue) && bValue !== null && bValue !== '';

          if (aIsNumber && bIsNumber) {
            return sortOrder === "ASC" ? aValue - bValue : bValue - aValue;
          } else {
            const aStr = String(aValue || '');
            const bStr = String(bValue || '');
            return sortOrder === "ASC"
              ? aStr.localeCompare(bStr)
              : bStr.localeCompare(aStr);
          }
        });
      }

      const startIndex = (currentPage - 1) * rowsPerPage;
      const endIndex = currentPage * rowsPerPage;
      return filtered.slice(startIndex, endIndex);
    }
    return [];
  }, [data, searchTerm, sortWithAddress, currentPage, rowsPerPage]);

  return (
    <div className="max-w-4xl mx-auto my-5 p-5 bg-white rounded-lg shadow-lg max-w-full overflow-auto">
      <div className="flex flex-wrap items-center justify-start mb-4 gap-y-2">
        <div className='w-max flex flex-col justify-start items-start relative z-10'>
          <span 
            className='w-full block cursor-pointer text-xs gap-x-3 p-3 py-3.5 border border-gray-300 rounded-lg bg-gray-50 shadow-sm w-max max-w-xs h-full' 
            onClick={() => setToggleFileOptions(v => v === "hidden" ? "flex" : "hidden")}
          >
            File Options {toggleFileOptions === "hidden" ? "🔽" : "🔼"}
          </span>
          <ul className={`w-max ${toggleFileOptions} flex-col gap-y-1 bg-gray-50 px-4 py-4 absolute z-20 left-0 top-[18px]`}>
            {fileOptions.length > 0 ? (
              fileOptions.map((file, i) => (
                <li className='text-xs flex felx-row items-center justify-between gap-x-2 border-t ' key={i}>
                  <span className='max-w-[160px] overflow-hidden' title={file.fileName}> {file.fileName} </span>
                  <div className='flex flex-row gap-x-1'>
                    <button 
                      className="text-[7px] text-gray-50 px-3 py-1 bg-red-500 rounded-sm" 
                      onClick={() => handleDeleteFile(file.fileName)}
                    >
                      Delete
                    </button>
                    <button 
                      className="text-[7px] text-gray-50 px-3 py-1 bg-green-500 rounded-sm" 
                      onClick={() => handleExportFile(file.fileName)}
                    >
                      Export
                    </button>
                    <button 
                      className="text-[7px] text-gray-50 px-3 py-1 bg-blue-500 rounded-sm" 
                      onClick={() => selectFileHandler(file.fileName)}
                    >
                      Load
                    </button>
                  </div>
                </li>
              ))
            ) : (
              <span className='text-[8px] '>No Files Available</span>
            )}
          </ul>
        </div>

        <fieldset className="flex items-center gap-x-3 p-3 border border-gray-300 rounded-lg bg-gray-50 shadow-sm w-max max-w-xs ml-3">
          <label htmlFor="file-input" className="cursor-pointer text-gray-700 font-semibold text-sm">
            <span style={{whiteSpace:"nowrap"}} className="bg-blue-500 text-white text-[10px] px-3 py-2 rounded-md hover:bg-blue-700 transition-colors">
              Upload File
            </span>
          </label>
          <input
            id="file-input"
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <span className="text-gray-800 font-medium text-[10px]">
            {fileName || "No File Selected"}
          </span>
        </fieldset>

        <button 
          className='text-[10px] gap-x-3 p-3 rounded-lg bg-gray-50 shadow-sm w-max max-w-xs bg-orange-500 rounded-sm hover:bg-orange-600 text-gray-50 ml-3' 
          onClick={() => window.location.reload()}
        >
          Reload Page
        </button>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search..."
          className="p-2 border border-gray-300 rounded-md w-full"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full w-max table-auto border-collapse mb-4">
          <thead className="bg-gray-100">
            <tr>
              {headers.map((header, index) => (
                <th key={index} className="px-4 py-2 text-xs md:text-sm border-b text-left font-semibold text-gray-700">
                  {header}
                  {(header === "ADDRESS" || header === "MEMBER") ? 
                    <fieldset className='ml-1 flex gap-x-[4px] mt-[6px]'>
                      <span className='flex flex-col'>
                        <label className='text-[8px]' htmlFor={`${header}-SORT-NONE`}>NONE</label>
                        <input 
                          defaultChecked={true} 
                          onChange={(e) => setSortWithAddress(e.target.value)} 
                          type='radio' 
                          name={`${header}-SORT`} 
                          id={`${header}-SORT-NONE`} 
                          className='text-xs' 
                          value="" 
                        />
                      </span>

                      <span className='flex flex-col'>
                        <label className='text-[8px]' htmlFor={`${header}-SORT-ASC`}>ASC</label>
                        <input 
                          onChange={(e) => setSortWithAddress(e.target.value)} 
                          type='radio' 
                          name={`${header}-SORT`} 
                          id={`${header}-SORT-ASC`} 
                          className='text-xs' 
                          value={`${header}-ASC`} 
                        />
                      </span>

                      <span className='flex flex-col'>
                        <label className='text-[8px]' htmlFor={`${header}-SORT-DESC`}>DESC</label>
                        <input 
                          onChange={(e) => setSortWithAddress(e.target.value)} 
                          type='radio' 
                          name={`${header}-SORT`} 
                          id={`${header}-SORT-DESC`} 
                          className='text-xs' 
                          value={`${header}-DESC`} 
                        />
                      </span>
                    </fieldset>
                    : ""
                  }
                </th>
              ))}
              <th className="px-4 py-2 border-b text-left font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedDataOne?.map((row, rowIndex) => (
              <tr 
                key={`${row.MEMBER}-${rowIndex}`} 
                className={rowIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
              >
                {headers.map((header, colIndex) => (
                  <td key={colIndex} className="px-4 py-2 text-xs md:text-sm text-gray-600">
                    {row[header] || ''}
                  </td>
                ))}
                <td className="px-3 py-1.5 flex gap-x-1 gap-y-1 border-b text-xs text-gray-600">
                  <button
                    onClick={async () => {
                      if (isNaN(row.MEMBER)) {
                        const result = await Swal.fire({
                          title: 'Member id is not correct!',
                          text: `Cannot delete the member!`,
                          icon: 'warning',
                          showCancelButton: true,
                          cancelButtonText: 'Okay, Cancel!',
                          reverseButtons: true,
                        });
                      }
                      else {
                        deleteMemberFun(row.MEMBER, row.NAME);
                      }
                    }}
                    className="px-3 py-1.5 bg-red-500 text-xs text-white rounded-md"
                  >
                    {isNaN(row.MEMBER) ? <span className='line-through'>Delete</span> : "Delete"}
                  </button>
                  <button
                    onClick={() => { 
                      // Find the index of the current row in the original data array
                      const originalIndex = data.findIndex(item => 
                        item.MEMBER === row.MEMBER && item.NAME === row.NAME
                      );
                      setEditingRowIndex(originalIndex);
                      setEditedData(row);
                      setIsModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-blue-500 text-xs text-white rounded-md"
                  >
                    {isNaN(row.MEMBER) ? <span className='line-through'>Edit</span> : "Edit"}
                  </button>
                  <button 
                    className="px-3 py-1.5 bg-blue-500 text-xs text-white rounded-md" 
                    onClick={() => toggleMailForm(row)}
                  >
                    Mail 
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-2 bg-gray-200 text-gray-600 rounded-md cursor-pointer disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm text-gray-600">
          Page {currentPage} of {Math.ceil(data.length / rowsPerPage) || 1}
        </span>
        <button
          onClick={() => setCurrentPage(Math.min(Math.ceil(data.length / rowsPerPage), currentPage + 1))}
          disabled={currentPage * rowsPerPage >= data.length}
          className="p-2 bg-gray-200 text-gray-600 rounded-md cursor-pointer disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {isMailModalOpen && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-h-[90vh] overflow-auto">
            <h2 className="text-lg font-semibold mb-3"> Send Mail </h2>
            {Object.keys(mailForm).map((mail, i) => {
              if (mail !== "htmlContent") return (
                <div key={mail} className="mb-4">
                  <label htmlFor={mail} className="block text-gray-700 text-xs mb-1 text-uppercase">
                    {mail}
                  </label>
                  {mail !== "message" ? (
                    <input
                      type={
                        mail === "attachment" ? "file" : 
                        mail === "date" ? "date" : 
                        mail === "to" ? "email" : "text"
                      }
                      id={mail}
                      name={mail}
                      value={mailForm[mail]}
                      onChange={(e) => handleMailFormChange(e.target)}
                      className="w-full p-2 border border-gray-300 rounded-sm text-xs"
                    />
                  ) : (
                    <textarea
                      id={mail}
                      name={mail}
                      value={mailForm[mail]}
                      onChange={(e) => handleMailFormChange(e.target)}
                      className="w-full p-2 border border-gray-300 rounded-sm text-xs"
                    />
                  )}
                </div>
              );
            })}
            <div className="flex justify-between">
              <button 
                onClick={submitMail} 
                className="px-4 py-2 bg-green-500 text-white rounded-sm text-xs"
              >
                Send
              </button>
              <button
                onClick={() => setIsMailModalOpen(false)}
                className="px-4 py-2 bg-red-500 text-white rounded-sm text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-h-[90vh] overflow-auto">
            <h2 className="text-lg font-semibold mb-3">Edit Row</h2>
            {Object.keys(editedData).map((header) => (
              <div key={header} className="mb-4">
                <label htmlFor={header} className="block text-gray-700 text-xs mb-1">
                  {header}
                </label>
                <input
                  type="text"
                  id={header}
                  name={header}
                  value={editedData[header] || ''}
                  onChange={(e) => handleFieldChange(e.target)}
                  className="w-full p-2 border border-gray-300 rounded-sm text-xs"
                />
              </div>
            ))}
            <div className="flex justify-between">
              <button 
                onClick={handleSaveEdit} 
                className={`px-4 py-2 ${isSaving ? 'bg-gray-400' : 'bg-green-500'} text-white rounded-sm text-xs flex items-center`}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : 'Save'}
              </button>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingRowIndex(null);
                  setEditedData({});
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-sm text-xs"
                disabled={isSaving}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;