use std::io::Read;
use std::net::TcpStream;
use std::time::Duration;

const HOST: &str = "127.0.0.1";
const PORT: u16 = 19876;

/// Hook sender mode: read JSON from stdin, send to pet widget via TCP, then exit.
pub fn run_hook_sender() {
    let mut buf = Vec::new();
    if std::io::stdin().read_to_end(&mut buf).is_err() || buf.is_empty() {
        return;
    }

    // Validate JSON
    if serde_json::from_slice::<serde_json::Value>(&buf).is_err() {
        return;
    }

    // Send to pet widget
    if let Ok(mut stream) = TcpStream::connect_timeout(
        &format!("{HOST}:{PORT}").parse().unwrap(),
        Duration::from_secs(1),
    ) {
        let _ = std::io::Write::write_all(&mut stream, &buf);
    }
}
