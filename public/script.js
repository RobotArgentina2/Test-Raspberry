document.addEventListener('DOMContentLoaded', () => {
    const sensorForm = document.getElementById('sensor-form');
    const temperatureInput = document.getElementById('temperature');
    const humidityInput = document.getElementById('humidity');
    const readingsBody = document.getElementById('readings-body');
    const refreshBtn = document.getElementById('refresh-btn');
    const statusMessage = document.getElementById('status-message');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    let sensorChart = null; // Referencia al gráfico

    // URL del servidor (usamos relativo ya que está en la misma carpeta public)
    const API_URL = '/api/data';

    // Función para obtener y mostrar datos
    async function fetchReadings() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Error al obtener datos');

            const data = await response.json();
            // Invertir datos para el gráfico (de más antiguo a más reciente)
            const chartData = [...data].reverse();
            renderTable(data);
            updateChart(chartData);
        } catch (err) {
            console.error(err);
            readingsBody.innerHTML = '<tr><td colspan="4" class="status-error">Error al conectar con el servidor</td></tr>';
        }
    }

    // Función para inicializar/actualizar el gráfico
    function updateChart(data) {
        const canvas = document.getElementById('readingsChart');
        const ctx = canvas.getContext('2d');

        const labels = data.map(row => `#${row.id}`);
        const temps = data.map(row => row.temperature);
        const hums = data.map(row => row.humidity);
        const times = data.map(row => formatDate(row.timestamp));

        // Crear Gradientes
        const tempGradient = ctx.createLinearGradient(0, 0, 0, 400);
        tempGradient.addColorStop(0, 'rgba(251, 146, 60, 0.5)');
        tempGradient.addColorStop(1, 'rgba(251, 146, 60, 0)');

        const humGradient = ctx.createLinearGradient(0, 0, 0, 400);
        humGradient.addColorStop(0, 'rgba(56, 189, 248, 0.5)');
        humGradient.addColorStop(1, 'rgba(56, 189, 248, 0)');

        if (sensorChart) {
            sensorChart.data.labels = labels;
            sensorChart.data.datasets[0].data = temps;
            sensorChart.data.datasets[1].data = hums;
            sensorChart.options.plugins.tooltip.callbacks.footer = (context) => {
                const index = context[0].dataIndex;
                return `Hora: ${times[index]}`;
            };
            sensorChart.update();
        } else {
            Chart.defaults.font.family = "'Outfit', sans-serif";
            Chart.defaults.color = '#94a3b8';

            sensorChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Temperatura (°C)',
                            data: temps,
                            borderColor: '#fb923c',
                            borderWidth: 3,
                            pointBackgroundColor: '#fb923c',
                            pointBorderColor: 'rgba(255,255,255,0.2)',
                            pointHoverRadius: 6,
                            pointRadius: 4,
                            backgroundColor: tempGradient,
                            tension: 0.4,
                            fill: true,
                            yAxisID: 'y'
                        },
                        {
                            label: 'Humedad (%)',
                            data: hums,
                            borderColor: '#38bdf8',
                            borderWidth: 3,
                            pointBackgroundColor: '#38bdf8',
                            pointBorderColor: 'rgba(255,255,255,0.2)',
                            pointHoverRadius: 6,
                            pointRadius: 4,
                            backgroundColor: humGradient,
                            tension: 0.4,
                            fill: true,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            align: 'end',
                            labels: {
                                usePointStyle: true,
                                padding: 20,
                                font: { size: 12, weight: '600' }
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            titleFont: { size: 14, weight: 'bold' },
                            bodyFont: { size: 13 },
                            padding: 12,
                            cornerRadius: 10,
                            displayColors: true,
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                            borderWidth: 1,
                            callbacks: {
                                footer: (context) => {
                                    const index = context[0].dataIndex;
                                    return `📅 ${times[index]}`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: {
                                maxRotation: 0,
                                autoSkip: true,
                                maxTicksLimit: 10
                            }
                        },
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: { display: true, text: 'Temperatura (°C)', font: { weight: 'bold' } },
                            grid: { color: 'rgba(255, 255, 255, 0.05)' },
                            suggestedMin: 15,
                            suggestedMax: 40
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: { display: true, text: 'Humedad (%)', font: { weight: 'bold' } },
                            grid: { drawOnChartArea: false },
                            suggestedMin: 0,
                            suggestedMax: 100
                        }
                    }
                }
            });
        }
    }

    // Renderizar la tabla
    function renderTable(data) {
        if (data.length === 0) {
            readingsBody.innerHTML = '<tr><td colspan="4">No hay lecturas registradas</td></tr>';
            return;
        }

        readingsBody.innerHTML = data.map(row => `
      <tr>
        <td>#${row.id}</td>
        <td class="temp-cell">${row.temperature}°C</td>
        <td class="hum-cell">${row.humidity}%</td>
        <td>${formatDate(row.timestamp)}</td>
      </tr>
    `).join('');
    }

    // Formatear fecha
    function formatDate(dateStr) {
        const date = new Date(dateStr);
        // Ajustar si la fecha viene en UTC desde SQLite (por defecto CURRENT_TIMESTAMP usa UTC)
        // El navegador automáticamente lo convertirá a la zona horaria local.
        return new Intl.DateTimeFormat('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).format(date);
    }

    // Manejar envío de formulario
    sensorForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const temperature = parseFloat(temperatureInput.value);
        const humidity = parseFloat(humidityInput.value);

        // Estado visual de carga
        submitBtn.disabled = true;
        btnText.textContent = 'Guardando...';
        statusMessage.textContent = '';
        statusMessage.className = 'status-message';

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ temperature, humidity })
            });

            const result = await response.json();

            if (response.ok) {
                statusMessage.textContent = '✓ Lectura registrada con éxito';
                statusMessage.classList.add('status-success');
                sensorForm.reset();
                // Recargar tabla
                await fetchReadings();
            } else {
                throw new Error(result.error || 'Error desconocido');
            }
        } catch (err) {
            statusMessage.textContent = '✗ ' + err.message;
            statusMessage.classList.add('status-error');
        } finally {
            submitBtn.disabled = false;
            btnText.textContent = 'Guardar Lectura';
        }
    });

    // Botón de refrescar manual
    refreshBtn.addEventListener('click', () => {
        refreshBtn.classList.add('spinning');
        fetchReadings().finally(() => {
            setTimeout(() => refreshBtn.classList.remove('spinning'), 500);
        });
    });

    // Inicializar carga de datos
    fetchReadings();
});
