// main.rs - Punto di ingresso dell'eseguibile desktop BlasPDF
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    blaspdf_lib::run();
}
