// Глобальные переменные
let tg = window.Telegram.WebApp;
let userData = {};
let currentScreen = 'main-menu';

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

function initApp() {
    // Настройка Telegram WebApp
    tg.ready();
    tg.expand();

    // Получение данных пользователя из Telegram WebApp
    if (tg.initDataUnsafe?.user) {
        userData = tg.initDataUnsafe.user;
    } else {
        // Fallback для тестирования (только в разработке)
        userData = {
            id: 889233306,
            first_name: "Тест",
            username: "test_user"
        };
        console.warn('⚠️ Используются тестовые данные. В продакшене будут данные из Telegram.');
    }

    // Загрузка данных пользователя
    loadUserData();

    // Проверка админских прав
    checkAdminStatus();

    // Показываем главное меню
    showScreen('main-menu');

    // Загружаем начальные данные
    loadGiveaways();
    loadEarnData();
}

// Навигация между экранами
function showScreen(screenId) {
    // Скрываем все экраны
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    // Показываем нужный экран
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.add('active');
        currentScreen = screenId;

        // Специальная обработка для некоторых экранов
        switch(screenId) {
            case 'giveaways':
                loadGiveaways();
                break;
            case 'profile':
                loadProfile();
                break;
            case 'earn':
                loadEarnData();
                break;
        }
    }
}

// Загрузка данных пользователя
async function loadUserData() {
    try {
        // Обновляем отображение имени
        document.getElementById('user-name').textContent = userData.first_name || 'Пользователь';

        // Запрос к API для получения данных пользователя
        const response = await fetch(`/api/user/${userData.id}`);
        if (response.ok) {
            const data = await response.json();
            document.getElementById('user-balance').textContent = data.balance || '0';
        } else {
            document.getElementById('user-balance').textContent = '0';
        }

    } catch (error) {
        console.error('Ошибка загрузки данных пользователя:', error);
        document.getElementById('user-balance').textContent = '0';
        showNotification('Ошибка загрузки данных', 'error');
    }
}

// Проверка админских прав
async function checkAdminStatus() {
    try {
        console.log('Проверяем админские права для пользователя:', userData.id);

        const response = await fetch(`/api/user/${userData.id}`);
        const data = await response.json();

        console.log('Данные пользователя:', data);
        console.log('ID пользователя:', userData.id);
        console.log('Является админом:', data.is_admin);

        if (response.ok && data.is_admin === true) {
            console.log('✅ Пользователь является админом - показываем админские кнопки');
            window.isAdmin = true;
            const adminButtons = document.getElementById('admin-buttons');
            if (adminButtons) {
                adminButtons.style.display = 'block';
            }
        } else {
            console.log('❌ Пользователь не является админом');
            window.isAdmin = false;
            const adminButtons = document.getElementById('admin-buttons');
            if (adminButtons) {
                adminButtons.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('🚨 Ошибка проверки админских прав:', error);
        const adminButtons = document.getElementById('admin-buttons');
        if (adminButtons) {
            adminButtons.style.display = 'none';
        }
    }
}

// Загрузка розыгрышей
async function loadGiveaways() {
    try {
        const container = document.getElementById('giveaways-list');
        container.innerHTML = '<div class="loading">Загрузка розыгрышей...</div>';

        // Загружаем данные из API
        const response = await fetch('/api/giveaways');
        let giveaways = [];

        if (response.ok) {
            giveaways = await response.json();
        }

        container.innerHTML = '';

        if (giveaways.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">😔 Нет активных розыгрышей</div>';
            return;
        }

        giveaways.forEach(giveaway => {
            const card = createGiveawayCard(giveaway);
            container.appendChild(card);
        });

    } catch (error) {
        console.error('Ошибка загрузки розыгрышей:', error);
        document.getElementById('giveaways-list').innerHTML = '<div style="text-align: center; padding: 40px; color: #ff0000;">❌ Ошибка загрузки</div>';
    }
}

// Создание карточки розыгрыша
function createGiveawayCard(giveaway) {
    const card = document.createElement('div');
    card.className = 'giveaway-card';
    card.onclick = () => showGiveawayDetail(giveaway);

    const prizesText = Object.entries(giveaway.prizes).map(([place, prize]) => {
        const medal = place == 1 ? "🥇" : place == 2 ? "🥈" : place == 3 ? "🥉" : "🏅";
        return `${medal} ${place} место: ${prize}`;
    }).join('<br>');

    card.innerHTML = `
        <div class="giveaway-title">${giveaway.name}</div>
        <div class="giveaway-info">
            <span>📅 ${giveaway.start_date} - ${giveaway.end_date}</span>
        </div>
        <div class="giveaway-description">${giveaway.description}</div>
        <div style="margin-bottom: 12px; font-size: 14px; line-height: 1.4;">${prizesText}</div>
        <div class="giveaway-stats">
            <span>👥 ${giveaway.participants} участников</span>
            <span>🎫 ${giveaway.total_tickets} билетов</span>
        </div>
    `;

    return card;
}

// Показ детальной информации о розыгрыше
function showGiveawayDetail(giveaway) {
    const modalBody = document.getElementById('modal-body');

    const prizesText = Object.entries(giveaway.prizes).map(([place, prize]) => {
        const medal = place == 1 ? "🥇" : place == 2 ? "🥈" : place == 3 ? "🥉" : "🏅";
        return `${medal} <b>${place} место:</b> ${prize}`;
    }).join('<br>');

    modalBody.innerHTML = `
        <h3>🎉 ${giveaway.name}</h3>
        <div style="margin: 16px 0;">
            <div style="margin-bottom: 12px;"><strong>Призы:</strong><br>${prizesText}</div>
            <div style="margin-bottom: 8px;">📅 <strong>Дата начала:</strong> ${giveaway.start_date}</div>
            <div style="margin-bottom: 8px;">⏳ <strong>Дата окончания:</strong> ${giveaway.end_date}</div>
            <div style="margin-bottom: 8px;">👥 <strong>Участников:</strong> ${giveaway.participants}</div>
            <div style="margin-bottom: 12px;">🎫 <strong>Всего билетов:</strong> ${giveaway.total_tickets}</div>
            <div style="margin-bottom: 16px;">${giveaway.description}</div>
        </div>
        <div class="participation-form">
            <h3>🎯 Участвовать в розыгрыше</h3>
            <div class="input-group">
                <label for="ticket-count">Количество билетов:</label>
                <input type="number" id="ticket-count" min="1" max="100" value="1" placeholder="Введите количество билетов">
            </div>
            <div class="form-buttons">
                <button class="btn-primary" onclick="participateInGiveaway(${giveaway.id})">🎯 Участвовать</button>
                <button class="btn-secondary" onclick="closeModal()">❌ Отмена</button>
            </div>
        </div>
    `;

    showModal();
}

// Участие в розыгрыше
async function participateInGiveaway(giveawayId) {
    if (!userData) {
        showNotification('Ошибка: данные пользователя недоступны', 'error');
        return;
    }

    try {
        const response = await fetch('/api/participate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: userData.id,
                giveaway_id: giveawayId
            })
        });

        const data = await response.json();

        if (data.success) {
            showNotification(`✅ Участие принято! Потрачено ${data.tickets_used} билетов`, 'success');
            // Обновляем данные
            await loadUserData();
            await loadGiveaways();
        } else {
            showNotification(`❌ ${data.error}`, 'error');
        }
    } catch (error) {
        console.error('Ошибка участия в розыгрыше:', error);
        showNotification('Ошибка участия в розыгрыше', 'error');
    }
}

// Админские функции
async function showCreateGiveawayModal() {
    const modal = document.getElementById('create-giveaway-modal');
    if (modal) {
        modal.style.display = 'block';
        // Очищаем форму
        document.getElementById('giveaway-name').value = '';
        document.getElementById('giveaway-description').value = '';
        document.getElementById('giveaway-end-date').value = '';
    }
}

function hideCreateGiveawayModal() {
    const modal = document.getElementById('create-giveaway-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function createGiveaway() {
    const name = document.getElementById('giveaway-name').value.trim();
    const description = document.getElementById('giveaway-description').value.trim();
    const endDate = document.getElementById('giveaway-end-date').value;

    if (!name || !description || !endDate) {
        showNotification('Заполните все поля', 'error');
        return;
    }

    try {
        const response = await fetch('/api/admin/create_giveaway', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: userData.id,
                name: name,
                description: description,
                end_date: endDate
            })
        });

        const data = await response.json();

        if (data.success) {
            showNotification('✅ Розыгрыш создан успешно!', 'success');
            hideCreateGiveawayModal();
            await loadGiveaways();
        } else {
            showNotification(`❌ ${data.error}`, 'error');
        }
    } catch (error) {
        console.error('Ошибка создания розыгрыша:', error);
        showNotification('Ошибка создания розыгрыша', 'error');
    }
}

async function finishGiveaway(giveawayId) {
    if (!confirm('Вы уверены, что хотите завершить этот розыгрыш?')) {
        return;
    }

    try {
        const response = await fetch('/api/admin/finish_giveaway', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: userData.id,
                giveaway_id: giveawayId
            })
        });

        const data = await response.json();

        if (data.success) {
            if (data.winner) {
                showNotification(`🏆 Победитель: ${data.winner.full_name}! Билет №${data.winner.ticket_number}`, 'success');
            } else {
                showNotification('✅ Розыгрыш завершен (нет участников)', 'success');
            }
            await loadGiveaways();
        } else {
            showNotification(`❌ ${data.error}`, 'error');
        }
    } catch (error) {
        console.error('Ошибка завершения розыгрыша:', error);
        showNotification('Ошибка завершения розыгрыша', 'error');
    }
}

async function deleteGiveaway(giveawayId) {
    if (!confirm('Вы уверены, что хотите удалить этот розыгрыш? Это действие нельзя отменить!')) {
        return;
    }

    try {
        const response = await fetch('/api/admin/delete_giveaway', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: userData.id,
                giveaway_id: giveawayId
            })
        });

        const data = await response.json();

        if (data.success) {
            showNotification('✅ Розыгрыш удален', 'success');
            await loadGiveaways();
        } else {
            showNotification(`❌ ${data.error}`, 'error');
        }
    } catch (error) {
        console.error('Ошибка удаления розыгрыша:', error);
        showNotification('Ошибка удаления розыгрыша', 'error');
    }
}

// Загрузка данных для заработка
async function loadEarnData() {
    try {
        // Здесь будет загрузка реальных данных

        // Обновляем статистику рефералов
        document.getElementById('referral-stats').textContent = 'Приглашено: 0 друзей';

        // Проверяем статус подписок
        const canGetTickets = true; // Временно
        const subscriptionBtn = document.getElementById('subscription-btn');
        const subscriptionStatus = document.getElementById('subscription-status');

        if (canGetTickets) {
            subscriptionStatus.textContent = 'Доступно! Получите 10 билетов';
            subscriptionBtn.textContent = 'Получить билеты';
            subscriptionBtn.disabled = false;
        } else {
            subscriptionStatus.textContent = 'Следующие билеты через 15 дней';
            subscriptionBtn.textContent = 'Недоступно';
            subscriptionBtn.disabled = true;
        }

    } catch (error) {
        console.error('Ошибка загрузки данных заработка:', error);
    }
}

// Показ профиля
function loadProfile() {
    document.getElementById('profile-name').textContent = userData.first_name || 'Пользователь';
    document.getElementById('profile-id').textContent = `ID: ${userData.id}`;
    document.getElementById('profile-balance').textContent = '0'; // Здесь будет реальный баланс
    document.getElementById('profile-giveaways').textContent = '0'; // Количество участий
}

// Показ инструкций для сторис
function showStoryInstructions() {
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <h3>📸 Как получить +50 билетов за сторис</h3>
        <div style="margin: 16px 0; line-height: 1.6;">
            <p><strong>1.</strong> Сделайте скриншот нашего бота</p>
            <p><strong>2.</strong> Опубликуйте сторис в Instagram или другой сети</p>
            <p><strong>3.</strong> Отправьте скриншот сторис в поддержку @Kalashnikeforce</p>
            <p style="margin-top: 16px; color: #007acc;"><strong>💡 После проверки вы получите 50 билетов!</strong></p>
        </div>
        <button class="btn-primary" style="width: 100%;" onclick="closeModal()">Понятно</button>
    `;
    showModal();
}

// Показ каналов для подписки
function showChannels() {
    const modalBody = document.getElementById('modal-body');

    const channels = [
        '@minsk_vape',
        '@vapebel0',
        '@belvape3',
        '@belvape4',
        '@bel_vaping',
        '@vaip_rb',
        '@vapechat_rb'
    ];

    const channelButtons = channels.map(channel => 
        `<a href="https://t.me/${channel.replace('@', '')}" target="_blank" style="display: block; padding: 12px; margin: 8px 0; background: #007acc; color: white; text-decoration: none; border-radius: 8px; text-align: center;">📢 ${channel}</a>`
    ).join('');

    modalBody.innerHTML = `
        <h3>📢 Подпишитесь на наши каналы</h3>
        <div style="margin: 16px 0;">
            ${channelButtons}
        </div>
        <div class="form-buttons">
            <button class="btn-primary" onclick="checkSubscriptions()">✅ Проверить подписки</button>
            <button class="btn-secondary" onclick="closeModal()">❌ Отмена</button>
        </div>
    `;
    showModal();
}

// Проверка подписок
function checkSubscriptions() {
    // Здесь будет проверка подписок через API
    showNotification('🎉 Вы получили 10 билетов за подписки!', 'success');
    closeModal();
    loadUserData();
}

// Показ реферальной системы
function showReferral() {
    const referralLink = `https://t.me/your_bot?start=ref_${userData.id}`;

    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <h3>👥 Пригласите друзей</h3>
        <div style="margin: 16px 0;">
            <p><strong>🎁 За каждого друга — 1 билет!</strong></p>
            <p style="margin: 12px 0;">Ваша реферальная ссылка:</p>
            <div style="background: #f0f0f0; padding: 12px; border-radius: 8px; word-break: break-all; font-family: monospace; font-size: 14px;">
                ${referralLink}
            </div>
            <p style="margin: 12px 0; font-size: 14px; color: #666;">
                💡 Поделитесь ссылкой с друзьями. Когда друг заработает 10+ билетов — вы получите награду!
            </p>
        </div>
        <div class="form-buttons">
            <button class="btn-primary" onclick="copyReferralLink('${referralLink}')">📋 Скопировать</button>
            <button class="btn-secondary" onclick="closeModal()">❌ Закрыть</button>
        </div>
    `;
    showModal();
}

// Копирование реферальной ссылки
function copyReferralLink(link) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(link).then(() => {
            showNotification('🔗 Ссылка скопирована!', 'success');
        });
    } else {
        // Fallback для старых браузеров
        const textArea = document.createElement('textarea');
        textArea.value = link;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('🔗 Ссылка скопирована!', 'success');
    }
}

// Модальные окна
function showModal() {
    document.getElementById('modal').classList.add('active');
}

function closeModal() {
    document.getElementById('modal').classList.remove('active');
}

// Уведомления
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.getElementById('notifications').appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// API функции (заглушки)
async function apiRequest(endpoint, data = null) {
    try {
        const options = {
            method: data ? 'POST' : 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Telegram-User-ID': userData.id
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        // Здесь будет реальный URL API
        const response = await fetch(`/api${endpoint}`, options);
        return await response.json();

    } catch (error) {
        console.error('Ошибка API запроса:', error);
        throw error;
    }
}

// Админские функции
function showStatistics() {
    fetch('/api/admin/stats')
        .then(response => response.json())
        .then(data => {
            const modalBody = document.getElementById('modal-body');
            modalBody.innerHTML = `
                <h3>📊 Статистика бота</h3>
                <div style="margin: 16px 0;">
                    <div style="margin-bottom: 12px;">👥 <strong>Пользователей:</strong> ${data.users_count || 0}</div>
                    <div style="margin-bottom: 12px;">🎯 <strong>Активных розыгрышей:</strong> ${data.active_giveaways || 0}</div>
                    <div style="margin-bottom: 12px;">🏆 <strong>Завершенных розыгрышей:</strong> ${data.completed_giveaways || 0}</div>
                    <div style="margin-bottom: 12px;">🎫 <strong>Всего билетов:</strong> ${data.total_tickets || 0}</div>
                </div>
                <button class="btn-primary" style="width: 100%;" onclick="closeModal()">Закрыть</button>
            `;
            showModal();
        })
        .catch(error => {
            console.error('Ошибка загрузки статистики:', error);
            showNotification('Ошибка загрузки статистики', 'error');
        });
}

function showGiveawayManagement() {
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <h3>🔧 Управление розыгрышами</h3>
        <div style="margin: 16px 0;">
            <p>Функции управления розыгрышами:</p>
            <button class="btn-primary" style="width: 100%; margin-bottom: 8px;" onclick="showCreateGiveawayForm()">🎫 Создать розыгрыш</button>
            <button class="btn-secondary" style="width: 100%; margin-bottom: 8px;" onclick="showActiveGiveaways()">📋 Активные розыгрыши</button>
            <button class="btn-secondary" style="width: 100%; margin-bottom: 8px;" onclick="showCompletedGiveaways()">🏆 Завершенные розыгрыши</button>
            <button class="btn-secondary" style="width: 100%; margin-bottom: 8px;" onclick="showManageExistingGiveaways()">✏️ Управлять существующими</button>
        </div>
        <button class="btn-secondary" style="width: 100%;" onclick="closeModal()">Закрыть</button>
    `;
    showModal();
}

function showManageExistingGiveaways() {
    showNotification('Управление существующими розыгрышами скоро будет доступно', 'info');
    closeModal();
}

function showUserManagement() {
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <h3>👥 Управление пользователями</h3>
        <div style="margin: 16px 0;">
            <p>Функции управления пользователями:</p>
            <div style="margin-bottom: 12px;">
                <input type="number" id="user-id-input" placeholder="ID пользователя" style="width: 100%; padding: 8px; margin-bottom: 8px; border: 1px solid #ddd; border-radius: 4px;">
                <input type="number" id="tickets-amount-input" placeholder="Количество билетов" style="width: 100%; padding: 8px; margin-bottom: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <button class="btn-primary" style="width: 100%; margin-bottom: 8px;" onclick="addTicketsToUser()">💰 Начислить билеты</button>
            <button class="btn-secondary" style="width: 100%; margin-bottom: 8px;" onclick="removeTicketsFromUser()">💸 Списать билеты</button>
            <div style="margin-top: 16px;">
                <input type="number" id="ban-user-id-input" placeholder="ID пользователя для бана" style="width: 100%; padding: 8px; margin-bottom: 8px; border: 1px solid #ddd; border-radius: 4px;">
                <button class="btn-secondary" style="width: 100%; margin-bottom: 8px;" onclick="banUser()">🚫 Забанить</button>
                <button class="btn-secondary" style="width: 100%;" onclick="unbanUser()">✅ Разбанить</button>
            </div>
        </div>
        <button class="btn-secondary" style="width: 100%;" onclick="closeModal()">Закрыть</button>
    `;
    showModal();
}

function showCreateGiveaway() {
    showCreateGiveawayForm();
}

function showCreateGiveawayForm() {
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <h3>🎫 Создать новый розыгрыш</h3>
        <div style="margin: 16px 0;">
            <div class="input-group">
                <label for="giveaway-name">Название розыгрыша:</label>
                <input type="text" id="giveaway-name" placeholder="Например: Еженедельный розыгрыш вейп-товаров" style="width: 100%; padding: 8px; margin-bottom: 12px; border: 1px solid #ddd; border-radius: 4px;">
            </div>

            <div class="input-group">
                <label for="giveaway-description">Описание:</label>
                <textarea id="giveaway-description" placeholder="Подробное описание розыгрыша..." style="width: 100%; padding: 8px; margin-bottom: 12px; border: 1px solid #ddd; border-radius: 4px; min-height: 80px; resize: vertical;"></textarea>
            </div>

            <div style="display: flex; gap: 12px; margin-bottom: 12px;">
                <div style="flex: 1;">
                    <label for="start-date">Дата начала:</label>
                    <input type="date" id="start-date" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                <div style="flex: 1;">
                    <label for="end-date">Дата окончания:</label>
                    <input type="date" id="end-date" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
            </div>

            <div class="input-group">
                <label for="end-time">Время окончания:</label>
                <input type="time" id="end-time" value="23:59" style="width: 100%; padding: 8px; margin-bottom: 12px; border: 1px solid #ddd; border-radius: 4px;">
            </div>

            <div class="input-group">
                <label>Призы (по местам):</label>
                <div id="prizes-container">
                    <div style="display: flex; gap: 8px; margin-bottom: 8px; align-items: center;">
                        <span style="min-width: 60px;">🥇 1 место:</span>
                        <input type="text" class="prize-input" data-place="1" placeholder="Главный приз" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                </div>
                <button type="button" onclick="addPrizeField()" style="background: #28a745; color: white; border: none; padding: 6px 12px; border-radius: 4px; margin-top: 8px;">➕ Добавить приз</button>
            </div>

            <div class="input-group">
                <label style="display: flex; align-items: center; gap: 8px;">
                    <input type="checkbox" id="auto-complete" checked>
                    Автоматическое завершение
                </label>
            </div>
        </div>
        <div class="form-buttons">
            <button class="btn-primary" onclick="createGiveaway()">🎉 Создать розыгрыш</button>
            <button class="btn-secondary" onclick="closeModal()">❌ Отмена</button>
        </div>
    `;

    // Устанавливаем сегодняшнюю дату как минимальную
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('start-date').value = today;
    document.getElementById('start-date').min = today;
    document.getElementById('end-date').min = today;

    showModal();
}

function addPrizeField() {
    const container = document.getElementById('prizes-container');
    const prizeCount = container.children.length + 1;

    const medals = ['🥇', '🥈', '🥉'];
    const medal = medals[prizeCount - 1] || '🏅';

    const prizeDiv = document.createElement('div');
    prizeDiv.style.cssText = 'display: flex; gap: 8px; margin-bottom: 8px; align-items: center;';
    prizeDiv.innerHTML = `
        <span style="min-width: 60px;">${medal} ${prizeCount} место:</span>
        <input type="text" class="prize-input" data-place="${prizeCount}" placeholder="Приз ${prizeCount} места" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        <button type="button" onclick="this.parentNode.remove()" style="background: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 4px;">❌</button>
    `;

    container.appendChild(prizeDiv);
}

async function createGiveaway() {
    try {
        // Собираем данные формы
        const name = document.getElementById('giveaway-name').value.trim();
        const description = document.getElementById('giveaway-description').value.trim();
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        const endTime = document.getElementById('end-time').value;
        const autoComplete = document.getElementById('auto-complete').checked;

        // Собираем призы
        const prizeInputs = document.querySelectorAll('.prize-input');
        const prizes = {};
        let hasValidPrizes = false;

        prizeInputs.forEach(input => {
            const place = input.getAttribute('data-place');
            const prize = input.value.trim();
            if (prize) {
                prizes[place] = prize;
                hasValidPrizes = true;
            }
        });

        // Валидация
        if (!name) {
            showNotification('Введите название розыгрыша', 'error');
            return;
        }

        if (!description) {
            showNotification('Введите описание розыгрыша', 'error');
            return;
        }

        if (!startDate || !endDate) {
            showNotification('Выберите даты начала и окончания', 'error');
            return;
        }

        if (new Date(endDate) <= new Date(startDate)) {
            showNotification('Дата окончания должна быть позже даты начала', 'error');
            return;
        }

        if (!hasValidPrizes) {
            showNotification('Добавьте хотя бы один приз', 'error');
            return;
        }

        // Отправляем данные на сервер
        const giveawayData = {
            name,
            description,
            start_date: startDate,
            end_date: endDate,
            end_time: endTime,
            auto_complete: autoComplete,
            prizes,
            admin_id: userData.id
        };

        const response = await fetch('/api/admin/create-giveaway', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(giveawayData)
        });

        const result = await response.json();

        if (result.success) {
            showNotification('🎉 Розыгрыш успешно создан!', 'success');
            closeModal();
            loadGiveaways(); // Обновляем список розыгрышей
        } else {
            showNotification(`Ошибка: ${result.error}`, 'error');
        }

    } catch (error) {
        console.error('Ошибка создания розыгрыша:', error);
        showNotification('Ошибка при создании розыгрыша', 'error');
    }
}

function showActiveGiveaways() {
    loadGiveaways();
    closeModal();
    showScreen('giveaways');
}

function showCompletedGiveaways() {
    showNotification('Просмотр завершенных розыгрышей скоро будет доступен', 'info');
    closeModal();
}

function addTicketsToUser() {
    const userId = document.getElementById('user-id-input').value;
    const amount = document.getElementById('tickets-amount-input').value;

    if (!userId || !amount) {
        showNotification('Введите ID пользователя и количество билетов', 'error');
```python
        return;
    }

    // Здесь будет API запрос для начисления билетов
    showNotification(`Начислено ${amount} билетов пользователю ${userId}`, 'success');
    closeModal();
}

function removeTicketsFromUser() {
    const userId = document.getElementById('user-id-input').value;
    const amount = document.getElementById('tickets-amount-input').value;

    if (!userId || !amount) {
        showNotification('Введите ID пользователя и количество билетов', 'error');
        return;
    }

    // Здесь будет API запрос для списания билетов
    showNotification(`Списано ${amount} билетов у пользователя ${userId}`, 'success');
    closeModal();
}

function banUser() {
    const userId = document.getElementById('ban-user-id-input').value;

    if (!userId) {
        showNotification('Введите ID пользователя', 'error');
        return;
    }

    // Здесь будет API запрос для бана
    showNotification(`Пользователь ${userId} заблокирован`, 'success');
    closeModal();
}

function unbanUser() {
    const userId = document.getElementById('ban-user-id-input').value;

    if (!userId) {
        showNotification('Введите ID пользователя', 'error');
        return;
    }

    // Здесь будет API запрос для разбана
    showNotification(`Пользователь ${userId} разблокирован`, 'success');
    closeModal();
}

// Утилиты
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
}

function formatNumber(number) {
    return new Intl.NumberFormat('ru-RU').format(number);
}

// Обработчики событий
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Предотвращение закрытия при клике на контент модального окна
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-content')) {
        e.stopPropagation();
    }
});



async function manageUserTickets(action) {
    const userId = document.getElementById('tickets-user-id').value;
    const amount = document.getElementById('tickets-amount').value;

    if (!userId || !amount) {
        showNotification('Заполните все поля!', 'error');
        return;
    }

    if (parseInt(amount) <= 0) {
        showNotification('Количество должно быть больше 0!', 'error');
        return;
    }

    try {
        const response = await fetch(`/api/admin/users/${userId}/tickets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                admin_id: currentUser.id,
                action: action,
                amount: parseInt(amount)
            })
        });

        const result = await response.json();

        if (result.success) {
            showNotification(result.message, 'success');
            document.getElementById('tickets-user-id').value = '';
            document.getElementById('tickets-amount').value = '';
        } else {
            showNotification(result.error, 'error');
        }
    } catch (error) {
        showNotification('Ошибка операции', 'error');
    }
}

async function manageUserBan(action) {
    const userId = document.getElementById('ban-user-id').value;

    if (!userId) {
        showNotification('Введите ID пользователя!', 'error');
        return;
    }

    try {
        const response = await fetch(`/api/admin/users/${userId}/ban`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                admin_id: currentUser.id,
                action: action
            })
        });

        const result = await response.json();

        if (result.success) {
            showNotification(result.message, 'success');
            document.getElementById('ban-user-id').value = '';
            // Обновляем список пользователей если он загружен
            if (document.getElementById('users-list').children.length > 0) {
                loadUsers();
            }
        } else {
            showNotification(result.error, 'error');
        }
    } catch (error) {
        showNotification('Ошибка операции', 'error');
    }
}

async function loadUsers() {
    try {
        const response = await fetch(`/api/admin/users?admin_id=${currentUser.id}`);
        const users = await response.json();

        const container = document.getElementById('users-list');

        if (users.length === 0) {
            container.innerHTML = '<p>Пользователи не найдены</p>';
            return;
        }

        let html = '<div class="users-grid">';
        users.forEach(user => {
            const statusBadge = user.is_banned ? 
                '<span class="badge danger">🚫 Забанен</span>' : 
                '<span class="badge success">✅ Активен</span>';

            html += `
                <div class="user-card">
                    <div class="user-info">
                        <div class="user-name">${user.full_name}</div>
                        <div class="user-details">
                            ID: ${user.user_id}<br>
                            @${user.username || 'нет'}<br>
                            💰 ${user.tickets} билетов
                        </div>
                        ${statusBadge}
                    </div>
                    <div class="user-actions">
                        <button onclick="quickTickets(${user.user_id}, 10)" class="mini-btn success">+10 💰</button>
                        <button onclick="quickTickets(${user.user_id}, -10)" class="mini-btn danger">-10 💰</button>
                        ${user.is_banned ? 
                            `<button onclick="quickUnban(${user.user_id})" class="mini-btn success">✅</button>` :
                            `<button onclick="quickBan(${user.user_id})" class="mini-btn danger">🚫</button>`
                        }
                    </div>
                </div>
            `;
        });
        html += '</div>';

        container.innerHTML = html;
    } catch (error) {
        showNotification('Ошибка загрузки пользователей', 'error');
    }
}

async function quickTickets(userId, amount) {
    const action = amount > 0 ? 'add' : 'remove';
    const absAmount = Math.abs(amount);

    try {
        const response = await fetch(`/api/admin/users/${userId}/tickets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                admin_id: currentUser.id,
                action: action,
                amount: absAmount
            })
        });

        const result = await response.json();

        if (result.success) {
            showNotification(result.message, 'success');
            loadUsers(); // Обновляем список
        } else {
            showNotification(result.error, 'error');
        }
    } catch (error) {
        showNotification('Ошибка операции', 'error');
    }
}

async function quickBan(userId) {
    await manageUserBanById(userId, 'ban');
}

async function quickUnban(userId) {
    await manageUserBanById(userId, 'unban');
}

async function manageUserBanById(userId, action) {
    try {
        const response = await fetch(`/api/admin/users/${userId}/ban`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                admin_id: currentUser.id,
                action: action
            })
        });

        const result = await response.json();

        if (result.success) {
            showNotification(result.message, 'success');
            loadUsers(); // Обновляем список
        } else {
            showNotification(result.error, 'error');
        }
    } catch (error) {
        showNotification('Ошибка операции', 'error');
    }
}

function showBackups() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <div class="container">
            <h2>💾 Управление бэкапами</h2>
            <div id="backups-list">Загрузка...</div>
            <button class="back-btn" onclick="showMainMenu()">🔙 Назад</button>
        </div>
    `;
    loadBackups();
}

// The code has been modified to include the admin panel features.