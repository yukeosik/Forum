-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Хост: 127.0.0.1
-- Время создания: Янв 05 2026 г., 08:53
-- Версия сервера: 10.4.32-MariaDB
-- Версия PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- База данных: `forum_auth`
--

-- --------------------------------------------------------

--
-- Структура таблицы `topics`
--

CREATE TABLE `topics` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `author_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `is_pinned` tinyint(1) DEFAULT 0,
  `is_locked` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Дамп данных таблицы `topics`
--

INSERT INTO `topics` (`id`, `title`, `content`, `author_id`, `category_id`, `is_pinned`, `is_locked`, `created_at`, `updated_at`) VALUES
(1, '123', '123', 1, 10, 0, 0, '2025-11-19 04:57:47', '2025-11-19 04:57:47'),
(2, 'Попа', 'пися', 1, 10, 0, 0, '2025-11-19 04:58:34', '2025-11-19 05:04:56'),
(3, 'YAVAHUE', 'фывфы', 1, 10, 0, 0, '2025-11-19 05:05:18', '2025-11-24 08:48:42'),
(4, 'ssss', 'asdasd', 1, 10, 0, 0, '2025-11-24 09:03:10', '2025-12-08 01:42:36'),
(5, 'aaa', 'aaa', 1, 10, 0, 0, '2025-11-24 09:03:17', '2025-11-24 09:03:17'),
(6, 'zzzz', 'zzz', 1, 10, 0, 0, '2025-11-24 09:03:23', '2025-11-24 09:03:23'),
(7, 'пиьски', 'поипкф', 1, 1, 0, 0, '2025-12-03 20:28:50', '2025-12-03 20:38:21'),
(8, 'dffgsdgsd', 'asfasfsfa', 1, 10, 0, 0, '2025-12-04 18:36:39', '2025-12-04 18:36:39'),
(9, '123123zxd', 'weadsфыв', 1, 1, 0, 0, '2025-12-04 18:37:19', '2025-12-19 11:00:27'),
(10, 'Dasdas', 'adasd', 1, 1, 0, 0, '2025-12-19 11:17:26', '2025-12-19 11:17:26'),
(11, 'Vasdasdasd', '1312312', 1, 1, 0, 0, '2025-12-19 11:17:34', '2025-12-19 11:17:34'),
(12, '12345', '123', 1, 1, 0, 0, '2025-12-19 11:18:51', '2025-12-19 11:31:03');

--
-- Индексы сохранённых таблиц
--

--
-- Индексы таблицы `topics`
--
ALTER TABLE `topics`
  ADD PRIMARY KEY (`id`),
  ADD KEY `author_id` (`author_id`),
  ADD KEY `category_id` (`category_id`);

--
-- AUTO_INCREMENT для сохранённых таблиц
--

--
-- AUTO_INCREMENT для таблицы `topics`
--
ALTER TABLE `topics`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- Ограничения внешнего ключа сохраненных таблиц
--

--
-- Ограничения внешнего ключа таблицы `topics`
--
ALTER TABLE `topics`
  ADD CONSTRAINT `topics_ibfk_1` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `topics_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
