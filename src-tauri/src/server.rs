use tauri::Emitter;
use tokio::io::AsyncReadExt;
use tokio::net::TcpListener;

const HOST: &str = "127.0.0.1";
const PORT: u16 = 19876;

/// TCP socket server that receives JSON from hook sender
/// and emits it as a Tauri event to the frontend.
pub async fn socket_server(app: tauri::AppHandle) {
    let listener = match TcpListener::bind(format!("{HOST}:{PORT}")).await {
        Ok(l) => {
            println!("[pet] Listening on {HOST}:{PORT}");
            l
        }
        Err(e) => {
            eprintln!("[pet] Port {PORT} already in use: {e}");
            return;
        }
    };

    loop {
        let (mut stream, _addr) = match listener.accept().await {
            Ok(conn) => conn,
            Err(e) => {
                eprintln!("[pet] Accept error: {e}");
                continue;
            }
        };

        let app_handle = app.clone();
        tokio::spawn(async move {
            let mut buf = Vec::with_capacity(4096);
            if let Err(e) = stream.read_to_end(&mut buf).await {
                eprintln!("[pet] Read error: {e}");
                return;
            }

            if buf.is_empty() {
                return;
            }

            match serde_json::from_slice::<serde_json::Value>(&buf) {
                Ok(payload) => {
                    if let Err(e) = app_handle.emit("pet-event", &payload) {
                        eprintln!("[pet] Emit error: {e}");
                    }
                }
                Err(e) => {
                    eprintln!("[pet] JSON parse error: {e}");
                }
            }
        });
    }
}
