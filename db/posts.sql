-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Хост: 127.0.0.1
-- Время создания: Янв 05 2026 г., 08:52
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
-- Структура таблицы `posts`
--

CREATE TABLE `posts` (
  `id` int(11) NOT NULL,
  `content` text NOT NULL,
  `author_id` int(11) NOT NULL,
  `topic_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `parent_post_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Дамп данных таблицы `posts`
--

INSERT INTO `posts` (`id`, `content`, `author_id`, `topic_id`, `created_at`, `updated_at`, `parent_post_id`) VALUES
(1, '123', 1, 3, '2025-11-21 06:57:51', '2025-11-21 06:57:51', NULL),
(2, 'jopA', 1, 3, '2025-11-21 06:57:58', '2025-11-21 06:57:58', NULL),
(3, '123', 1, 3, '2025-11-21 06:59:27', '2025-11-21 06:59:27', NULL),
(4, 'фыв', 1, 3, '2025-11-24 08:48:42', '2025-11-24 08:48:42', NULL),
(5, '123', 1, 7, '2025-12-03 20:28:56', '2025-12-03 20:28:56', NULL),
(6, 'cvbxbdh', 1, 9, '2025-12-04 18:37:35', '2025-12-04 18:37:35', NULL),
(7, 'asda', 1, 9, '2025-12-08 01:12:42', '2025-12-08 01:12:42', 6),
(8, 'durak', 1, 9, '2025-12-08 01:12:50', '2025-12-08 01:12:50', 7),
(9, 'jopa', 1, 9, '2025-12-08 01:14:11', '2025-12-08 01:14:11', NULL),
(10, '123', 1, 9, '2025-12-08 01:18:58', '2025-12-08 01:18:58', NULL),
(11, 'adasd', 2, 4, '2025-12-08 01:42:36', '2025-12-08 01:42:36', NULL),
(12, 'jklhjk', 2, 9, '2025-12-08 01:57:48', '2025-12-08 01:57:48', 10),
(13, 'fsdf', 1, 9, '2025-12-19 11:00:27', '2025-12-19 11:00:27', 12),
(14, '1234', 1, 12, '2025-12-19 11:31:03', '2025-12-19 11:31:03', NULL);

--
-- Индексы сохранённых таблиц
--

--
-- Индексы таблицы `posts`
--
ALTER TABLE `posts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `author_id` (`author_id`),
  ADD KEY `topic_id` (`topic_id`),
  ADD KEY `parent_post_id` (`parent_post_id`);

--
-- AUTO_INCREMENT для сохранённых таблиц
--

--
-- AUTO_INCREMENT для таблицы `posts`
--
ALTER TABLE `posts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- Ограничения внешнего ключа сохраненных таблиц
--

--
-- Ограничения внешнего ключа таблицы `posts`
--
ALTER TABLE `posts`
  ADD CONSTRAINT `posts_ibfk_1` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `posts_ibfk_2` FOREIGN KEY (`topic_id`) REFERENCES `topics` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `posts_ibfk_3` FOREIGN KEY (`parent_post_id`) REFERENCES `posts` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
