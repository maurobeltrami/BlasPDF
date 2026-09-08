// lib.rs - Inizializzazione della libreria Tauri per BlasPDF
pub mod commands;

/// Configura ed avvia l'ecosistema Tauri per BlasPDF
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            commands::get_default_docs_dir,
            commands::read_pdf_file,
            commands::save_pdf_file,
        ])
        .run(tauri::generate_context!())
        .expect("Errore durante l'esecuzione dell'applicazione Tauri");
}
