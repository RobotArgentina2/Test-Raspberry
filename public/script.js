document.addEventListener('DOMContentLoaded', () => {
    const sensorForm = document.getElementById('sensor-form');
    const temperatureInput = document.getElementById('temperature');
    const humidityInput = document.getElementById('humidity');
    const readingsBody = document.getElementById('readings-body');
    const refreshBtn = document.getElementById('refresh-btn');
    const statusMessage = document.getElementById('status-message');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');

    // URL del servidor (usamos relativo ya que está en la misma carpeta public)
    const API_URL = '/api/data';

    // Función para obtener y mostrar datos
    async function fetchReadings() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Error al obtener datos');

            const data = await response.json();
            renderTable(data);
        } catch (err) {
            console.error(err);
            readingsBody.innerHTML = '<tr><td colspan="4" class="status-error">Error al conectar con el servidor</td></tr>';
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
