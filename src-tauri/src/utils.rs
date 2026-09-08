// utils.rs - Funzioni di utilità per codifica e decodifica binaria Base64

/// Codifica un buffer di byte in stringa Base64
pub fn base64_encode(data: &[u8]) -> String {
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

/// Decodifica una stringa Base64 in vettore di byte
pub fn base64_decode(s: &str) -> Result<Vec<u8>, &'static str> {
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
