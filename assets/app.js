/* 11-1 — одна страница: разделы и документы в них.

   Сборки нет: страница читает data/index.json прямо в браузере. Индекс,
   PDF и миниатюры пишет скрипт выкладки в knowledge
   (.claude/meta/push-eleven-one.py) — руками здесь правится только код. */
(function () {
  "use strict";

  var MONTHS = ["янв.", "февр.", "марта", "апр.", "мая", "июня",
                "июля", "авг.", "сент.", "окт.", "нояб.", "дек."];
  var MONTHS_FULL = ["января", "февраля", "марта", "апреля", "мая", "июня",
                     "июля", "августа", "сентября", "октября", "ноября", "декабря"];

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

  /* «2026-10-09» → «9 окт.»; год — только если не текущий. */
  function shortDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
    if (!m) return "";
    var s = +m[3] + " " + MONTHS[+m[2] - 1];
    return +m[1] === new Date().getFullYear() ? s : s + " " + m[1];
  }

  function longDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
    return m ? +m[3] + " " + MONTHS_FULL[+m[2] - 1] + " " + m[1] : "";
  }

  /* Строка ведёт прямо в PDF, в новой вкладке: промежуточная страница
     «о файле» стоила бы лишнего нажатия каждый раз. */
  function row(item) {
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
    label.appendChild(el("span", "row-title", item.title));
    var sub = [];
    if (item.sub) sub.push(item.sub);
    if (item.pages) sub.push(item.pages + " " + plural(item.pages, "страница", "страницы", "страниц"));
    if (sub.length) label.appendChild(el("span", "row-sub", sub.join(" · ")));
    a.appendChild(label);

    var day = shortDate(item.date);
    if (day) {
      var aside = el("span", "row-aside", day);
      aside.title = "обновлено " + longDate(item.date);
      a.appendChild(aside);
    }
    return a;
  }

  function block(group) {
    var sec = el("section", "block");
    var head = el("div", "block-head");
    head.appendChild(el("h2", null, group.title));
    head.appendChild(el("span", "block-count", String(group.items.length)));
    sec.appendChild(head);
    var panel = el("div", "panel");
    group.items.forEach(function (item) { panel.appendChild(row(item)); });
    sec.appendChild(panel);
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
