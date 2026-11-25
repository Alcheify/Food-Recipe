import { useEffect, useRef, useState } from 'react'
import { CameraIcon } from './Icons'

export default function ImageUpload({ file, onChange, existingUrl = '' }) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState(existingUrl)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    if (!file) {
      setPreview(existingUrl || '')
      return undefined
    }

    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [file, existingUrl])

  function acceptFiles(fileList) {
    const next = fileList?.[0]
    if (next) onChange(next)
  }

  function handleDrop(event) {
    event.preventDefault()
    setDragging(false)
    acceptFiles(event.dataTransfer.files)
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      inputRef.current?.click()
    }
  }

  return (
    <div className="image-upload">
      <div
        className={`dropzone${dragging ? ' dragging' : ''}${preview ? ' has-preview' : ''}`}
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={handleKeyDown}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        aria-label="Upload a food photo"
      >
        {preview ? (
          <>
            <img src={preview} alt="Recipe preview" />
            <span className="dropzone-overlay">Click or drop to replace</span>
          </>
        ) : (
          <div className="dropzone-empty">
            <span className="dropzone-icon">
              <CameraIcon size={26} />
            </span>
            <strong>Add a food photo</strong>
            <span>Drag and drop, or click to browse</span>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(event) => {
          acceptFiles(event.target.files)
          event.target.value = ''
        }}
      />

      <div className="image-upload-foot">
        <span>JPG, PNG, or WebP · up to 10 MB · compressed automatically</span>
        {file ? (
          <button type="button" className="text-button" onClick={() => onChange(null)}>
            Undo selection
          </button>
        ) : null}
      </div>
    </div>
  )
}
