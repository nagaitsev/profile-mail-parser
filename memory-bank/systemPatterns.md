# Архитектурные паттерны и решения

## Общая архитектура
Проект представляет собой одностраничное приложение (SPA), работающее полностью на стороне клиента. Вся логика преобразования текста выполняется в браузере с помощью JavaScript, что исключает необходимость в серверной части для основной функциональности.

## Ключевые решения
- **Чистый JavaScript:** Отказ от внешних библиотек и фреймворков для минимизации зависимостей и полного контроля над процессом преобразования.
- **Прямая манипуляция DOM:** Пользовательский ввод считывается из элемента `<textarea>`, а результат записывается непосредственно в элемент `<code>`, что обеспечивает простоту и высокую производительность.
- **Модульная обработка:** Процесс конвертации разбит на последовательность шагов (обработка строк, списков, абзацев, специальных символов), что упрощает добавление новых правил и отладку.

## Паттерны реализации
- **Построчная обработка:** Основная логика конвертации перебирает входной текст строка за строкой, применяя к каждой строке соответствующие правила форматирования.
- **Состояние в DOM:** Приложение не использует сложные механизмы управления состоянием. Текущее состояние (входной текст и результат) хранится непосредственно в DOM-элементах.
- **Специфичные правила форматирования:** Для реализации нестандартных требований (например, `###[**ТЕКСТ**](URL)`) используются регулярные выражения и строковые замены, нацеленные на конкретные шаблоны в начале строк.
