// lib.rs - Inizializzazione della libreria Tauri per BlasPDF
pub mod commands;
pub mod utils;

/// Configura ed avvia l'ecosistema Tauri per BlasPDF
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            commands::pick_and_read_pdf,
            commands::pick_and_save_pdf,
            commands::read_pdf_file,
            commands::save_pdf_file,
        ])
        .run(tauri::generate_context!())
        .expect("Errore durante l'esecuzione dell'applicazione Tauri");
}
