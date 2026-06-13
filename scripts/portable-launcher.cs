using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Text;
using System.Threading;
using System.Windows.Forms;

namespace HosgedopolPortable
{
    public sealed class PortableServerForm : Form
    {
        private const int Port = 8765;
        private readonly HttpListener listener = new HttpListener();
        private readonly Thread serverThread;
        private readonly string rootPath;
        private readonly string url = "http://127.0.0.1:8765/";

        public PortableServerForm()
        {
            rootPath = AppDomain.CurrentDomain.BaseDirectory;
            Text = "Hoja Preanestesica HOSGEDOPOL";
            Width = 430;
            Height = 190;
            FormBorderStyle = FormBorderStyle.FixedDialog;
            MaximizeBox = false;
            StartPosition = FormStartPosition.CenterScreen;

            var label = new Label
            {
                AutoSize = false,
                Dock = DockStyle.Top,
                Height = 86,
                Padding = new Padding(14),
                Text = "Hoja Preanestesica HOSGEDOPOL portable\r\n\r\nLa app esta abierta en el navegador.\r\nCierra esta ventana para detener el servidor local.",
            };

            var openButton = new Button
            {
                Left = 92,
                Top = 98,
                Width = 110,
                Text = "Abrir app",
            };
            openButton.Click += (_, __) => OpenBrowser();

            var closeButton = new Button
            {
                Left = 216,
                Top = 98,
                Width = 110,
                Text = "Cerrar",
            };
            closeButton.Click += (_, __) => Close();

            Controls.Add(label);
            Controls.Add(openButton);
            Controls.Add(closeButton);

            listener.Prefixes.Add(url);
            listener.Start();
            serverThread = new Thread(ServerLoop) { IsBackground = true };
            serverThread.Start();

            Shown += (_, __) => OpenBrowser();
            FormClosing += (_, __) => StopServer();
        }

        private void ServerLoop()
        {
            while (listener.IsListening)
            {
                try
                {
                    var context = listener.GetContext();
                    ThreadPool.QueueUserWorkItem(_ => HandleRequest(context));
                }
                catch
                {
                    if (!listener.IsListening) return;
                }
            }
        }

        private void HandleRequest(HttpListenerContext context)
        {
            try
            {
                var requestPath = WebUtility.UrlDecode(context.Request.Url.AbsolutePath.TrimStart('/'));
                if (string.IsNullOrWhiteSpace(requestPath)) requestPath = "index.html";

                var filePath = Path.GetFullPath(Path.Combine(rootPath, requestPath.Replace('/', Path.DirectorySeparatorChar)));
                var resolvedRoot = Path.GetFullPath(rootPath);

                if (!filePath.StartsWith(resolvedRoot, StringComparison.OrdinalIgnoreCase) || !File.Exists(filePath))
                {
                    WriteResponse(context, 404, "text/plain; charset=utf-8", Encoding.UTF8.GetBytes("No encontrado"));
                    return;
                }

                var bytes = File.ReadAllBytes(filePath);
                WriteResponse(context, 200, GetMimeType(filePath), bytes);
            }
            catch
            {
                try
                {
                    WriteResponse(context, 500, "text/plain; charset=utf-8", Encoding.UTF8.GetBytes("Error interno"));
                }
                catch
                {
                    // Ignore response failures while the app is closing.
                }
            }
        }

        private static void WriteResponse(HttpListenerContext context, int statusCode, string contentType, byte[] bytes)
        {
            context.Response.StatusCode = statusCode;
            context.Response.ContentType = contentType;
            context.Response.ContentLength64 = bytes.Length;
            context.Response.OutputStream.Write(bytes, 0, bytes.Length);
            context.Response.OutputStream.Close();
        }

        private static string GetMimeType(string path)
        {
            switch (Path.GetExtension(path).ToLowerInvariant())
            {
                case ".html": return "text/html; charset=utf-8";
                case ".js": return "text/javascript; charset=utf-8";
                case ".css": return "text/css; charset=utf-8";
                case ".json": return "application/json; charset=utf-8";
                case ".png": return "image/png";
                case ".jpg":
                case ".jpeg": return "image/jpeg";
                case ".svg": return "image/svg+xml";
                default: return "application/octet-stream";
            }
        }

        private void OpenBrowser()
        {
            Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
        }

        private void StopServer()
        {
            try
            {
                listener.Stop();
                listener.Close();
            }
            catch
            {
                // The listener may already be closed.
            }
        }

        [STAThread]
        public static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new PortableServerForm());
        }
    }
}
