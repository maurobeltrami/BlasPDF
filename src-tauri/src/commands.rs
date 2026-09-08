// commands.rs - Comandi IPC nativi per I/O file e controllo sistema
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

/// Restituisce la cartella Documenti o Home predefinita dell'utente
#[tauri::command]
pub fn get_default_docs_dir() -> String {
    dirs::document_dir()
        .or_else(dirs::home_dir)
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_else(|| "/".to_string())
}

/// Legge un file PDF dal filesystem locale e lo restituisce codificato in Base64
#[tauri::command]
pub fn read_pdf_file(file_path: String) -> Result<PdfFileResultDto, String> {
    let path = Path::new(&file_path);
    if !path.exists() {
        return Err(format!("File non trovato: {}", file_path));
    }

    let bytes = fs::read(path).map_err(|e| format!("Errore durante la lettura: {}", e))?;
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

/// Helper compatto per la codifica Base64 senza dipendenze pesanti esterne
fn base64_encode(data: &[u8]) -> String {
    const CHARSET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut result = String::with_capacity((data.len() + 2) / 3 * 4);
    for chunk in data.chunks(3) {
        let b0 = chunk[0];
        let b1 = if chunk.len() > 1 { chunk[1] } else { 0 };
        let b2 = if chunk.len() > 2 { chunk[2] } else { 0 };

        result.push(CHARSET[(b0 >> 2) as usize] as char);
        result.push(CHARSET[(((b0 & 3) << 4) | (b1 >> 4)) as usize] as char);
        if chunk.len() > 1 {
            result.push(CHARSET[(((b1 & 15) << 2) | (b2 >> 6)) as usize] as char);
        } else {
            result.push('=');
        }
        if chunk.len() > 2 {
            result.push(CHARSET[(b2 & 63) as usize] as char);
        } else {
            result.push('=');
        }
    }
    result
}

/// Helper compatto per la decodifica Base64
fn base64_decode(s: &str) -> Result<Vec<u8>, &'static str> {
    let clean = s.trim_end_matches('=');
    let mut buffer = Vec::with_capacity(clean.len() * 3 / 4);
    let mut acc = 0u32;
    let mut bits = 0;

    for byte in clean.bytes() {
        let val = match byte {
            b'A'..=b'Z' => byte - b'A',
            b'a'..=b'z' => byte - b'a' + 26,
            b'0'..=b'9' => byte - b'0' + 52,
            b'+' => 62,
            b'/' => 63,
            b'\r' | b'\n' | b' ' => continue,
            _ => return Err("Carattere Base64 non valido"),
        };
        acc = (acc << 6) | (val as u32);
        bits += 6;
        if bits >= 8 {
            bits -= 8;
            buffer.push((acc >> bits) as u8);
        }
    }
    Ok(buffer)
}
