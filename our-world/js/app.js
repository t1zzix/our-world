// ==========================================
// OUR LITTLE WORLD
// Scrapbook edition ♡
// ==========================================


// НАСТРОЙКИ И ХРАНИЛИЩЕ

const STORAGE_KEY = "ourLittleWorldEditorial_v1";

const emptyData = {
    foods: [],
    wishlist: [],
    wishes: [],
    memories: [],
    letters: [],
    places: [],
    events: []
};

let data = loadData();


function loadData() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved) {
            const parsed = JSON.parse(saved);

            return {
                ...emptyData,
                ...parsed
            };
        }
    } catch (error) {
        console.error("Ошибка загрузки данных:", error);
    }

    return structuredClone(emptyData);
}


function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error("Ошибка сохранения:", error);

        showToast("Не удалось сохранить данные. Возможно, фото слишком большие.");
        return false;
    }
}


// ==========================================
// НАВИГАЦИЯ
// ==========================================

const pageNames = {
    home: "HOME",
    foods: "FOODS",
    wishlist: "WISHLIST",
    wishes: "WISHES",
    memories: "MEMORIES",
    letters: "LETTERS",
    places: "PLACES",
    calendar: "CALENDAR"
};


function openPage(pageName) {
    const page = document.getElementById(`page-${pageName}`);

    if (!page) return;

    document.querySelectorAll(".page").forEach(element => {
        element.classList.remove("active");
    });

    page.classList.add("active");

    document.querySelectorAll(".nav-link").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === pageName
        );
    });

    document.getElementById("currentPageName").textContent =
        pageNames[pageName] || "HOME";

    history.replaceState(null, "", `#${pageName}`);

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


document.addEventListener("click", event => {
    const pageButton = event.target.closest("[data-page]");

    if (!pageButton) return;

    event.preventDefault();

    openPage(pageButton.dataset.page);
});


// Открываем нужную вкладку при загрузке

const initialPage = location.hash.replace("#", "");

if (pageNames[initialPage]) {
    openPage(initialPage);
} else {
    openPage("home");
}


// ==========================================
// УВЕДОМЛЕНИЯ
// ==========================================

let toastTimer;


function showToast(message) {
    const toast = document.getElementById("toast");

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2800);
}


// ==========================================
// БЕЗОПАСНОЕ ОТОБРАЖЕНИЕ ТЕКСТА
// ==========================================

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const symbols = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return symbols[character];
    });
}


// ==========================================
// ОБРАБОТКА ФОТОГРАФИЙ
// ==========================================

function readImage(file) {
    return new Promise((resolve, reject) => {

        if (!file) {
            resolve("");
            return;
        }

        if (!file.type.startsWith("image/")) {
            reject(new Error("Выберите файл изображения."));
            return;
        }

        const reader = new FileReader();

        reader.onload = function () {

            const image = new Image();

            image.onload = function () {

                const maxSize = 1400;

                let width = image.width;
                let height = image.height;

                if (width > maxSize || height > maxSize) {

                    const scale = Math.min(
                        maxSize / width,
                        maxSize / height
                    );

                    width = Math.round(width * scale);
                    height = Math.round(height * scale);
                }

                const canvas = document.createElement("canvas");

                canvas.width = width;
                canvas.height = height;

                const context = canvas.getContext("2d");

                context.drawImage(
                    image,
                    0,
                    0,
                    width,
                    height
                );

                resolve(
                    canvas.toDataURL("image/jpeg", 0.78)
                );
            };

            image.onerror = function () {
                reject(new Error("Не удалось обработать фотографию."));
            };

            image.src = reader.result;
        };

        reader.onerror = function () {
            reject(new Error("Не удалось прочитать файл."));
        };

        reader.readAsDataURL(file);
    });
}


// ==========================================
// УНИВЕРСАЛЬНОЕ ДОБАВЛЕНИЕ ЗАПИСЕЙ
// ==========================================

const formSettings = {

    foods: {
        list: "foodsList",
        empty: "Здесь пока нет любимых блюд.",
        category: "FOOD"
    },

    wishlist: {
        list: "wishlistList",
        empty: "Ваш список желаний пока пуст.",
        category: "WISHLIST"
    },

    wishes: {
        list: "wishesList",
        empty: "Здесь пока нет желаний.",
        category: "OUR WISHES"
    },

    memories: {
        list: "memoriesList",
        empty: "Здесь пока нет воспоминаний.",
        category: "MEMORY"
    },

    letters: {
        list: "lettersList",
        empty: "Пока никто не написал письмо.",
        category: "LETTER"
    },

    places: {
        list: "placesList",
        empty: "Вы ещё не добавили ни одного места.",
        category: "PLACE"
    },

    events: {
        list: "calendarList",
        empty: "В календаре пока нет событий.",
        category: "EVENT"
    }

};


document.querySelectorAll("[data-form]").forEach(form => {

    form.addEventListener("submit", async event => {

        event.preventDefault();

        const type = form.dataset.form;

        if (!formSettings[type]) return;

        const formData = new FormData(form);

        const title = formData.get("title")?.trim();

        if (!title) {
            showToast("Сначала укажи название ♡");
            return;
        }

        const file = formData.get("image");

        const submitButton = form.querySelector(
            'button[type="submit"]'
        );

        submitButton.disabled = true;

        try {

            const image = await readImage(file);

            const item = {
                id: crypto.randomUUID
                    ? crypto.randomUUID()
                    : `${Date.now()}-${Math.random()}`,

                title: title,

                author: formData.get("author")?.trim() || "",

                date: formData.get("date") || "",

                description: formData.get("description")?.trim() || "",

                ingredients: formData.get("ingredients")?.trim() || "",

                recipe: formData.get("recipe")?.trim() || "",

                image: image,

                createdAt: Date.now()
            };


            if (type === "foods") {
                item.description = [
                    item.ingredients
                        ? `Ингредиенты: ${item.ingredients}`
                        : "",

                    item.recipe
                        ? `Рецепт: ${item.recipe}`
                        : ""
                ].filter(Boolean).join("\n\n");
            }


            const confirmed = window.confirm(
                `Добавить «${title}» в ваш личный альбом? ♡`
            );

            if (!confirmed) {
                return;
            }


            data[type].push(item);

            if (!saveData()) {
                data[type].pop();
                return;
            }

            form.reset();

            renderAll();

            showToast("Успешно сохранено! ♡");

        } catch (error) {

            console.error(error);

            showToast(error.message || "Что-то пошло не так.");

        } finally {

            submitButton.disabled = false;

        }

    });

});


// ==========================================
// СОЗДАНИЕ КАРТОЧЕК
// ==========================================

function createCard(item, type, index) {

    const settings = formSettings[type];

    const date = item.date
        ? new Date(`${item.date}T00:00:00`).toLocaleDateString("ru-RU")
        : "";

    let imageHTML = "";

    if (item.image) {

        imageHTML = `
            <img
                class="item-image"
                src="${escapeHTML(item.image)}"
                alt="${escapeHTML(item.title)}"
                data-lightbox
            >
        `;

    } else {

        imageHTML = `
            <div class="item-image-placeholder">
                ♡
            </div>
        `;

    }


    let description = item.description || "";

    if (type === "wishlist" && item.description) {
        description = item.description;
    }


    return `
        <article class="item-card" data-id="${escapeHTML(item.id)}">

            ${imageHTML}

            <div class="item-meta">
                ${escapeHTML(settings.category)}
                ${date ? ` · ${escapeHTML(date)}` : ""}
            </div>

            <h3>${escapeHTML(item.title)}</h3>

            ${
                description
                    ? `<div class="item-description">${escapeHTML(description)}</div>`
                    : ""
            }

            ${
                item.author
                    ? `<div class="item-author">added by · ${escapeHTML(item.author)}</div>`
                    : ""
            }

            <button
                class="delete-button"
                data-delete="${escapeHTML(type)}"
                data-id="${escapeHTML(item.id)}"
                type="button"
            >
                Удалить запись ×
            </button>

        </article>
    `;
}


// ==========================================
// ОТОБРАЖЕНИЕ ЗАПИСЕЙ
// ==========================================

function renderList(type) {

    const settings = formSettings[type];

    const container = document.getElementById(settings.list);

    if (!container) return;

    let items = [...data[type]];

    if (type === "events" || type === "memories") {

        items.sort((a, b) => {

            const dateA = a.date || "";
            const dateB = b.date || "";

            return dateB.localeCompare(dateA);
        });

    }


    if (items.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                <span>♡</span>
                <p>${escapeHTML(settings.empty)}</p>
            </div>
        `;

        return;
    }


    container.innerHTML = items
        .map(item => createCard(item, type))
        .join("");

}


// ==========================================
// УДАЛЕНИЕ ЗАПИСЕЙ
// ==========================================

document.addEventListener("click", event => {

    const deleteButton = event.target.closest("[data-delete]");

    if (!deleteButton) return;

    const type = deleteButton.dataset.delete;
    const id = deleteButton.dataset.id;

    if (!data[type]) return;

    const item = data[type].find(element => element.id === id);

    if (!item) return;


    const confirmed = window.confirm(
        `Ты действительно хочешь удалить «${item.title}»?`
    );

    if (!confirmed) return;


    const previousData = [...data[type]];

    data[type] = data[type].filter(
        element => element.id !== id
    );


    if (!saveData()) {
        data[type] = previousData;
        return;
    }


    renderAll();

    showToast("Запись удалена ♡");

});


// ==========================================
// ОБНОВЛЕНИЕ СТАТИСТИКИ
// ==========================================

function updateStats() {

    document.getElementById("statMemories").textContent =
        data.memories.length;

    document.getElementById("statFoods").textContent =
        data.foods.length;

    document.getElementById("statWishlist").textContent =
        data.wishlist.length;

    document.getElementById("statPlaces").textContent =
        data.places.length;

}


// ==========================================
// ОБНОВЛЕНИЕ ВСЕГО САЙТА
// ==========================================

function renderAll() {

    Object.keys(formSettings).forEach(type => {
        renderList(type);
    });

    updateStats();

}


// ==========================================
// ПРОСМОТР ФОТОГРАФИЙ
// ==========================================

document.addEventListener("click", event => {

    const image = event.target.closest("[data-lightbox]");

    if (!image) return;

    const lightbox = document.getElementById("lightbox");

    const lightboxImage = document.getElementById("lightboxImage");

    lightboxImage.src = image.src;

    lightbox.classList.add("active");

});


function closeLightbox() {

    const lightbox = document.getElementById("lightbox");

    const lightboxImage = document.getElementById("lightboxImage");

    lightbox.classList.remove("active");

    lightboxImage.src = "";

}


document.getElementById("lightboxClose").addEventListener(
    "click",
    closeLightbox
);


document.getElementById("lightbox").addEventListener(
    "click",
    event => {

        if (event.target.id === "lightbox") {
            closeLightbox();
        }

    }
);


document.addEventListener("keydown", event => {

    if (event.key === "Escape") {
        closeLightbox();
    }

});


// ==========================================
// ЗАПУСК
// ==========================================

renderAll();

console.log("Our Little World успешно загружен ♡");