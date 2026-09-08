// commands.rs - Comandi IPC nativi per I/O file, dialoghi nativi e controllo sistema
use crate::utils::{base64_decode, base64_encode};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

/// Struttura dati per il risultato della lettura di un file PDF
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PdfFileResultDto {
    pub file_path: String,
    pub file_name: String,
    pub size_bytes: u64,
    pub base64_data: String,
}

/// Apre il dialogo nativo di sistema per selezionare e leggere istantaneamente un file PDF
#[tauri::command]
pub fn pick_and_read_pdf() -> Result<Option<PdfFileResultDto>, String> {
    let file = rfd::FileDialog::new()
        .add_filter("Documento PDF", &["pdf"])
        .pick_file();

    match file {
        Some(path_buf) => {
            let path = path_buf.to_string_lossy().to_string();
            read_pdf_file(path).map(Some)
        }
        None => Ok(None),
    }
}

/// Apre il dialogo nativo di sistema per salvare un file PDF modificato su disco
#[tauri::command]
pub fn pick_and_save_pdf(suggested_name: String, base64_data: String) -> Result<Option<String>, String> {
    let file = rfd::FileDialog::new()
        .set_file_name(&suggested_name)
        .add_filter("Documento PDF", &["pdf"])
        .save_file();

    match file {
        Some(path_buf) => {
            let path = path_buf.to_string_lossy().to_string();
            save_pdf_file(path.clone(), base64_data)?;
            Ok(Some(path))
        }
        None => Ok(None),
    }
}

/// Legge un file PDF dal filesystem locale e lo restituisce codificato in Base64
#[tauri::command]
pub fn read_pdf_file(file_path: String) -> Result<PdfFileResultDto, String> {
    let path = Path::new(&file_path);
    if !path.exists() {
        return Err(format!("File non trovato: {}", file_path));
    }

    let bytes = fs::read(path).map_err(|e| format!("Errore lettura: {}", e))?;
    let size_bytes = bytes.len() as u64;
    let base64_data = base64_encode(&bytes);
    let file_name = path
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "documento.pdf".to_string());

    Ok(PdfFileResultDto {
        file_path,
        file_name,
        size_bytes,
        base64_data,
    })
}

/// Salva un buffer di byte codificato in Base64 in un file PDF su disco
#[tauri::command]
pub fn save_pdf_file(target_path: String, base64_data: String) -> Result<bool, String> {
    let bytes = base64_decode(&base64_data).map_err(|e| format!("Dati non validi: {}", e))?;
    fs::write(&target_path, bytes).map_err(|e| format!("Impossibile salvare il file: {}", e))?;
    Ok(true)
}
