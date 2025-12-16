#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>

const int PIN_LED_EMISSOR = 2;
const int PIN_LDR = 34;
const int PIN_BOMBA = 4;

const char* ssid = "Wokwi-GUEST";
const char* password = "";

WebServer server(80);

int valorLuz = 0;
bool titulacaoFinalizada = false;
int thresholdViragem = 2000;

const char index_html[] PROGMEM = R"rawliteral(
<!DOCTYPE HTML><html>
<head>
  <meta charset="UTF-8"> <title>OpenTitrator IoT</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: Arial, sans-serif; text-align: center; background-color: #f4f4f9; }
    h2 { color: #0056b3; }
    .card { background: white; max-width: 500px; margin: auto; padding: 20px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
    .sensor-box { font-size: 2rem; font-weight: bold; color: #333; margin: 20px; }
    .btn { background-color: #008CBA; border: none; color: white; padding: 15px 32px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; margin: 4px 2px; cursor: pointer; border-radius: 5px; }
    .btn-stop { background-color: #f44336; }
    .status-ok { color: green; }
    .status-end { color: magenta; font-weight: bold; animation: blinker 1s linear infinite; }
    @keyframes blinker { 50% { opacity: 0; } }
  </style>
  <script src="https://code.highcharts.com/highcharts.js"></script>
</head>
<body css="margin:auto;">
  <h2>🧪 OpenTitrator IoT</h2>
  <div class="card">
    <p>Transmitância (luz):</p>
    <div id="valorLuz" class="sensor-box">0</div>
    <div id="statusTexto" class="status-ok">Aguardando...</div>
    
    <hr>
    <h3>Controle da Bomba</h3>
    <button class="btn" onclick="acionarBomba(500)">Gotejar (0.5s)</button>
    <button class="btn" onclick="acionarBomba(2000)">Fluxo contínuo (2s)</button>
    
    <div id="chart-container" style="height: 200px; margin-top: 20px;"></div>
  </div>

<script>
var chartT = new Highcharts.Chart({
  chart:{ renderTo : 'chart-container' },
  title: { text: 'Curva de titulação (óptica)' },
  series: [{
    showInLegend: false,
    data: []
  }],
  yAxis: { title: { text: 'Luminosidade (raw)' } },
  xAxis: { type: 'datetime', dateTimeLabelFormats: { second: '%H:%M:%S' } },
  credits: { enabled: false }
});

setInterval(function ( ) {
  var x = (new Date()).getTime();
  fetch("/status").then(response => response.json()).then(data => {
    document.getElementById("valorLuz").innerHTML = data.luz;
    
    // Atualiza Gráfico
    if(chartT.series[0].data.length > 40) { chartT.series[0].addPoint([x, data.luz], true, true, true); }
    else { chartT.series[0].addPoint([x, data.luz], true, false, true); }
    
    // Lógica Visual de Viragem
    if(data.luz > 2000) { // Ajuste conforme calibração
        document.getElementById("statusTexto").innerHTML = "REAGINDO (ROSA)";
        document.getElementById("statusTexto").className = "status-end";
    } else {
        document.getElementById("statusTexto").innerHTML = "ESTÁVEL (INCOLOR)";
        document.getElementById("statusTexto").className = "status-ok";
    }
  });
}, 1000);

function acionarBomba(tempo) {
  fetch("/bomba?tempo=" + tempo);
}
</script>
</body>
</html>
)rawliteral";

void handleRoot() {
  server.send(200, "text/html", index_html);
}

void handleStatus() {
  String json = "{\"luz\":" + String(valorLuz) + "}";
  server.send(200, "application/json", json);
}

void handleBomba() {
  if (server.hasArg("tempo")) {
    int tempo = server.arg("tempo").toInt();
    Serial.println("Acionando Bomba por " + String(tempo) + "ms");
    digitalWrite(PIN_BOMBA, HIGH);
    delay(tempo); 
    digitalWrite(PIN_BOMBA, LOW);
  }
  server.send(200, "text/plain", "OK");
}


void setup() {
  Serial.begin(115200);
  
  pinMode(PIN_LED_EMISSOR, OUTPUT);
  pinMode(PIN_BOMBA, OUTPUT);
  pinMode(PIN_LDR, INPUT);

  digitalWrite(PIN_LED_EMISSOR, HIGH);

  Serial.print("Conectando ao Wi-Fi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  server.on("/", handleRoot);
  server.on("/status", handleStatus);
  server.on("/bomba", handleBomba);

  server.begin();
  Serial.println("Servidor Web Iniciado!");
}

void loop() {
  server.handleClient();
  
  valorLuz = analogRead(PIN_LDR);
  
  
  delay(10);
}