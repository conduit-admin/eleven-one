/* 11-1 — одна страница: разделы и документы в них.

   Сборки нет: страница читает data/index.json прямо в браузере. Индекс,
   PDF и миниатюры пишет скрипт выкладки в knowledge
   (.claude/meta/push-eleven-one.py) — руками здесь правится только код. */
(function () {
  "use strict";

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function plural(n, one, few, many) {
    var d = n % 10, h = n % 100;
    if (d === 1 && h !== 11) return one;
    if (d >= 2 && d <= 4 && (h < 12 || h > 14)) return few;
    return many;
  }

  /* Даты — числами, как на «Лучезарности» (владелец, 10.10.2026):
     «2026-10-09» → «09.10», в подсказке и подвале — с годом. */
  function shortDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
    return m ? m[3] + "." + m[2] : "";
  }

  function longDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
    return m ? m[3] + "." + m[2] + "." + m[1] : "";
  }

  function files(n) {
    return n + " " + plural(n, "файл", "файла", "файлов");
  }

  /* Строка ведёт прямо в PDF, в новой вкладке: промежуточная страница
     «о файле» стоила бы лишнего нажатия каждый раз. Под названием —
     категория, одно-два слова, как на «Лучезарности»: «Контрольная»,
     «Ответы». В группе название уже стоит в её шапке, и строка
     подписана одной категорией. */
  function row(item, inSet) {
    var a = el("a", "row");
    a.href = item.href;
    a.target = "_blank";
    a.rel = "noopener";

    if (item.thumb) {
      var img = el("img", "thumb");
      img.src = item.thumb;
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      a.appendChild(img);
    } else {
      a.appendChild(el("span", "nothumb"));
    }

    var label = el("span", "row-label");
    if (inSet) {
      label.appendChild(el("span", "row-title", item.kind || item.title));
    } else {
      label.appendChild(el("span", "row-title", item.title));
      if (item.kind) label.appendChild(el("span", "row-sub", item.kind));
    }
    /* Без подписи под названием строка однострочная — дата встаёт
       вровень с названием, а не к верху. */
    if (label.childNodes.length === 1) a.classList.add("row-one");
    a.appendChild(label);

    var day = shortDate(item.date);
    if (day) {
      var aside = el("span", "row-aside", day);
      aside.title = "обновлено " + longDate(item.date);
      a.appendChild(aside);
    }
    return a;
  }

  /* ── группа: работа и то, что к ней ──────────────────────

     Как на «Лучезарности» уроки с разборами: родной <details>,
     раскрывается без скрипта, клавиатурой и читалкой экрана. В закрытом
     виде — карточка с названием работы, числом файлов и шевроном;
     внутри строки на том же листе, без своей рамки: лист на листе
     выглядел бы коробкой в коробке. Какие группы открыты, помнит браузер
     читателя: это его удобство, а не данные, и в приватном окне всё
     просто закрыто. */
  function isOpen(id) {
    try { return localStorage.getItem("open:" + id) === "1"; } catch (e) { return false; }
  }

  function remember(id, on) {
    try {
      if (on) localStorage.setItem("open:" + id, "1");
      else localStorage.removeItem("open:" + id);
    } catch (e) { /* хранилище недоступно — помнить просто нечем */ }
  }

  function set(entry) {
    var box = el("details", "set");
    box.open = isOpen(entry.id);
    var head = el("summary", "set-head");
    head.appendChild(el("span", "set-title", entry.title));
    var meta = [files(entry.items.length)];
    if (entry.date) meta.push(shortDate(entry.date));
    head.appendChild(el("span", "set-meta", meta.join(" · ")));
    head.appendChild(el("span", "chev"));
    box.appendChild(head);
    var body = el("div", "set-body");
    entry.items.forEach(function (item) { body.appendChild(row(item, true)); });
    box.appendChild(body);
    box.addEventListener("toggle", function () { remember(entry.id, box.open); });
    return box;
  }

  /* Раздел — плашка и под ней по порядку: одиночные строки подряд
     собираются на один лист, каждая группа — своей карточкой. Число
     на плашке — файлы, а не строки: группа из двух — это два документа. */
  function block(group) {
    var sec = el("section", "block");
    var head = el("div", "block-head");
    head.appendChild(el("h2", null, group.title));
    var count = group.items.reduce(function (n, e) { return n + (e.items ? e.items.length : 1); }, 0);
    head.appendChild(el("span", "block-count", String(count)));
    sec.appendChild(head);
    var stack = el("div", "stack");
    var panel = null;
    group.items.forEach(function (entry) {
      if (entry.items) {
        panel = null;
        stack.appendChild(set(entry));
        return;
      }
      if (!panel) {
        panel = el("div", "panel");
        stack.appendChild(panel);
      }
      panel.appendChild(row(entry));
    });
    sec.appendChild(stack);
    return sec;
  }

  function render(data) {
    var main = document.getElementById("main");
    main.textContent = "";
    var groups = (data.groups || []).filter(function (g) { return g.items && g.items.length; });
    if (!groups.length) {
      main.appendChild(el("p", "empty", "Пока здесь ничего нет."));
    }
    groups.forEach(function (g) { main.appendChild(block(g)); });
    if (data.date) {
      document.getElementById("foot").textContent = "Обновлено " + longDate(data.date);
    }
  }

  function fail() {
    var main = document.getElementById("main");
    main.textContent = "";
    main.appendChild(el("p", "empty", "Список не загрузился. Обновите страницу."));
  }

  /* Логотипы в шапке — кнопки: нажатие только запускает анимацию.
     Класс снимается и ставится заново, чтобы она повторялась и при
     нажатии подряд; click ловит и палец, и Enter с пробелом. */
  document.querySelectorAll(".logo").forEach(function (btn) {
    btn.addEventListener("click", function () {
      btn.classList.remove("tap");
      void btn.offsetWidth;
      btn.classList.add("tap");
    });
    /* Анимации внутри кнопки одной длины: первая кончилась — кончились все. */
    btn.addEventListener("animationend", function () {
      btn.classList.remove("tap");
    });
  });

  /* no-cache — сверяться с сервером при каждом открытии: список меняется,
     а Pages держит файлы в кэше по десять минут. */
  fetch("data/index.json", { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(render)
    .catch(fail);
})();
