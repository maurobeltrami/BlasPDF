// commands.rs - Comandi IPC nativi per I/O file, dialoghi nativi e controllo sistema
use crate::utils::{base64_decode, base64_encode};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PdfFileResultDto {
    pub file_path: String,
    pub file_name: String,
    pub size_bytes: u64,
    pub base64_data: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ImageFileResultDto {
    pub file_path: String,
    pub file_name: String,
    pub mime_type: String,
    pub base64_data: String,
}

fn detect_mime(ext: &str) -> &'static str {
    match ext.to_lowercase().as_str() {
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "webp" => "image/webp",
        "svg" => "image/svg+xml",
        "bmp" => "image/bmp",
        "gif" => "image/gif",
        _ => "application/octet-stream",
    }
}

/// Seleziona e legge un file PDF con dialogo nativo
#[tauri::command]
pub fn pick_and_read_pdf() -> Result<Option<PdfFileResultDto>, String> {
    let file = rfd::FileDialog::new().add_filter("PDF", &["pdf"]).pick_file();
    match file {
        Some(pb) => read_pdf_file(pb.to_string_lossy().to_string()).map(Some),
        None => Ok(None),
    }
}

/// Seleziona una singola immagine con dialogo nativo
#[tauri::command]
pub fn pick_and_read_image() -> Result<Option<ImageFileResultDto>, String> {
    let filter = ["png", "jpg", "jpeg", "webp", "svg", "bmp", "gif"];
    let file = rfd::FileDialog::new().add_filter("Immagini", &filter).pick_file();
    match file {
        Some(pb) => {
            let bytes = fs::read(&pb).map_err(|e| format!("Errore lettura: {}", e))?;
            let ext = pb.extension().and_then(|s| s.to_str()).unwrap_or("png");
            let name = pb.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default();
            Ok(Some(ImageFileResultDto {
                file_path: pb.to_string_lossy().to_string(),
                file_name: name,
                mime_type: detect_mime(ext).to_string(),
                base64_data: base64_encode(&bytes),
            }))
        }
        None => Ok(None),
    }
}

/// Seleziona immagini multiple per conversioni batch
#[tauri::command]
pub fn pick_and_read_images() -> Result<Option<Vec<ImageFileResultDto>>, String> {
    let filter = ["png", "jpg", "jpeg", "webp", "svg", "bmp", "gif"];
    let files = rfd::FileDialog::new().add_filter("Immagini", &filter).pick_files();
    match files {
        Some(list) => {
            let mut res = Vec::new();
            for pb in list {
                if let Ok(bytes) = fs::read(&pb) {
                    let ext = pb.extension().and_then(|s| s.to_str()).unwrap_or("png");
                    let name = pb.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default();
                    res.push(ImageFileResultDto {
                        file_path: pb.to_string_lossy().to_string(),
                        file_name: name,
                        mime_type: detect_mime(ext).to_string(),
                        base64_data: base64_encode(&bytes),
                    });
                }
            }
            Ok(Some(res))
        }
        None => Ok(None),
    }
}

/// Salva un buffer Base64 su disco con filtro personalizzato
#[tauri::command]
pub fn pick_and_save_any_file(
    suggested_name: String,
    filter_name: String,
    filter_ext: String,
    base64_data: String,
) -> Result<Option<String>, String> {
    let file = rfd::FileDialog::new()
        .set_file_name(&suggested_name)
        .add_filter(&filter_name, &[filter_ext.as_str()])
        .save_file();
    match file {
        Some(pb) => {
            let path = pb.to_string_lossy().to_string();
            let bytes = base64_decode(&base64_data).map_err(|e| format!("Dati errati: {}", e))?;
            fs::write(&path, bytes).map_err(|e| format!("Errore salvataggio: {}", e))?;
            Ok(Some(path))
        }
        None => Ok(None),
    }
}

#[tauri::command]
pub fn pick_and_save_pdf(suggested_name: String, base64_data: String) -> Result<Option<String>, String> {
    pick_and_save_any_file(suggested_name, "PDF".to_string(), "pdf".to_string(), base64_data)
}

#[tauri::command]
pub fn read_pdf_file(file_path: String) -> Result<PdfFileResultDto, String> {
    let path = Path::new(&file_path);
    let bytes = fs::read(path).map_err(|e| format!("Errore lettura: {}", e))?;
    let size_bytes = bytes.len() as u64;
    let base64_data = base64_encode(&bytes);
    let file_name = path.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_else(|| "doc.pdf".to_string());
    Ok(PdfFileResultDto { file_path, file_name, size_bytes, base64_data })
}

#[tauri::command]
pub fn save_pdf_file(target_path: String, base64_data: String) -> Result<bool, String> {
    let bytes = base64_decode(&base64_data).map_err(|e| format!("Dati errati: {}", e))?;
    fs::write(&target_path, bytes).map_err(|e| format!("Errore salvataggio: {}", e))?;
    Ok(true)
}

#[tauri::command]
pub fn close_app(app_handle: tauri::AppHandle) {
    app_handle.exit(0);
}
