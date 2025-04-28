import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import Modal from 'react-modal';

// PDF worker ko set karna
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const ResumeModal = ({ isOpen, onRequestClose }) => {
  const [numPages, setNumPages] = useState(null);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Resume Modal"
      ariaHideApp={false}
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50"
    >
      <div className="bg-white p-4 rounded-lg max-w-4xl w-full h-full overflow-auto">
        <button
          onClick={onRequestClose}
          className="mb-4 text-red-500 hover:text-red-700 self-end"
        >
          Close
        </button>
        <div className="flex-1 overflow-auto">
          <Document
            file="/UsamaRiaz.pdf"
            onLoadSuccess={onDocumentLoadSuccess}
          >
            {Array.from({ length: numPages }, (_, index) => (
              <Page
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            ))}
          </Document>
        </div>
      </div>
    </Modal>
  );
};

export default ResumeModal;
