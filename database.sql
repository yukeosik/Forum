-- ph... SQLINES DEMO ***
-- ve... SQLINES DEMO ***
-- SQLINES DEMO *** admin.net/
--
-- Хо... SQLINES DEMO ***
-- SQLINES DEMO *** ек 30 2025 г., 02:32
-- SQLINES DEMO *** 0.4.32-MariaDB
-- Ве... SQLINES DEMO ***

/* SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO"; */
START TRANSACTION;
time_zone := "+00:00";


/* SQLINES DEMO *** CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/* SQLINES DEMO *** CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/* SQLINES DEMO *** COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/* SQLINES DEMO ***  utf8mb4 */;

--
-- SQLINES DEMO *** um_auth`
--

-- SQLINES DEMO *** ---------------------------------------

--
-- SQLINES DEMO ***  `categories`
--

-- SQLINES FOR EVALUATION USE ONLY (14 DAYS)
CREATE TABLE categories (
  id int NOT NULL,
  name varchar(255) NOT NULL,
  created_at timestamp(0) NOT NULL DEFAULT current_timestamp()
) ;

--
-- SQLINES DEMO *** цы `categories`
--

INSERT INTO categories (id, name, created_at) VALUES
(1, 'Новости и объявления', '2025-11-13 18:52:19'),
(2, 'Мероприятия и конкурсы', '2025-11-13 18:53:25'),
(3, 'Обновления игры', '2025-11-13 18:53:52'),
(4, 'Руководства по классам', '2025-11-13 18:54:02'),
(5, 'Гайды для новичков', '2025-11-13 18:54:12'),
(6, 'Секреты Progress RO', '2025-11-13 18:54:24'),
(7, 'Персонажи', '2025-11-13 18:54:38'),
(8, 'Зени, предметы', '2025-11-13 18:54:51'),
(9, 'Задать вопрос', '2025-11-13 18:55:06'),
(10, 'F.A.Q. по ошибкам', '2025-11-13 18:55:18');

-- SQLINES DEMO *** ---------------------------------------

--
-- SQLINES DEMO ***  `friendships`
--

CREATE TABLE friendships (
  id int NOT NULL,
  user_id int NOT NULL,
  friend_id int NOT NULL,
  status varchar(30) check (status in ('pending','accepted','rejected','blocked')) DEFAULT 'pending',
  created_at timestamp(0) NOT NULL DEFAULT current_timestamp(),
  updated_at timestamp(0) NOT NULL DEFAULT current_timestamp() /* ON UPDATE current_timestamp() */
) ;

--
-- SQLINES DEMO *** цы `friendships`
--

INSERT INTO friendships (id, user_id, friend_id, status, created_at, updated_at) VALUES
(1, 2, 1, 'accepted', '2025-12-09 03:23:24', '2025-12-09 03:29:32'),
(2, 1, 2, 'accepted', '2025-12-09 03:29:32', '2025-12-09 03:29:32');

-- SQLINES DEMO *** ---------------------------------------

--
-- SQLINES DEMO ***  `posts`
--

CREATE TABLE posts (
  id int NOT NULL,
  content text NOT NULL,
  author_id int NOT NULL,
  topic_id int NOT NULL,
  created_at timestamp(0) NOT NULL DEFAULT current_timestamp(),
  updated_at timestamp(0) NOT NULL DEFAULT current_timestamp() /* ON UPDATE current_timestamp() */,
  parent_post_id int DEFAULT NULL
) ;

--
-- SQLINES DEMO *** цы `posts`
--

INSERT INTO posts (id, content, author_id, topic_id, created_at, updated_at, parent_post_id) VALUES
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

-- SQLINES DEMO *** ---------------------------------------

--
-- SQLINES DEMO ***  `post_reactions`
--

CREATE TABLE post_reactions (
  id int NOT NULL,
  post_id int NOT NULL,
  user_id int NOT NULL,
  reaction_type varchar(20) NOT NULL,
  created_at timestamp(0) NOT NULL DEFAULT current_timestamp()
) ;

--
-- SQLINES DEMO *** цы `post_reactions`
--

INSERT INTO post_reactions (id, post_id, user_id, reaction_type, created_at) VALUES
(5, 8, 1, 'dislike', '2025-12-08 01:13:01'),
(7, 7, 1, 'laugh', '2025-12-08 01:13:07'),
(9, 11, 2, 'like', '2025-12-08 01:43:40'),
(14, 10, 2, 'dislike', '2025-12-08 01:57:55'),
(16, 5, 2, 'dislike', '2025-12-09 02:58:05'),
(18, 6, 1, 'like', '2025-12-19 11:15:15'),
(19, 10, 1, 'dislike', '2025-12-19 11:15:17'),
(20, 14, 1, 'like', '2025-12-19 11:31:04');

-- SQLINES DEMO *** ---------------------------------------

--
-- SQLINES DEMO ***  `private_messages`
--

CREATE TABLE private_messages (
  id int NOT NULL,
  sender_id int NOT NULL,
  receiver_id int NOT NULL,
  content text NOT NULL,
  is_read smallint DEFAULT 0,
  created_at timestamp(0) NOT NULL DEFAULT current_timestamp()
) ;

--
-- SQLINES DEMO *** цы `private_messages`
--

INSERT INTO private_messages (id, sender_id, receiver_id, content, is_read, created_at) VALUES
(1, 1, 2, 'жопа писька', 1, '2025-12-09 03:29:42'),
(2, 2, 1, 'писька попка', 1, '2025-12-09 03:31:21'),
(3, 1, 2, 'хуй', 1, '2025-12-10 06:33:43'),
(4, 2, 1, 'жопа', 1, '2025-12-10 06:33:55'),
(5, 1, 2, '[eq', 1, '2025-12-11 06:53:38'),
(6, 2, 1, '[eq', 1, '2025-12-11 06:53:52'),
(7, 1, 2, 'жопа', 1, '2025-12-11 06:58:06'),
(8, 2, 1, 'пася', 1, '2025-12-11 06:58:16'),
(9, 1, 2, 'фывфы', 1, '2025-12-11 06:58:20'),
(10, 1, 2, 'asdasd', 1, '2025-12-11 07:14:07'),
(11, 2, 1, 'asdsad', 1, '2025-12-11 07:14:14'),
(12, 2, 1, 'gsdfgsd', 1, '2025-12-11 07:14:18'),
(13, 1, 2, 'dfg', 1, '2025-12-11 07:14:20'),
(14, 2, 1, 'sad', 1, '2025-12-11 07:14:28'),
(15, 1, 2, 'asd', 1, '2025-12-11 07:14:31'),
(16, 1, 2, 'asd', 1, '2025-12-11 07:14:59'),
(17, 2, 1, 'gdf', 1, '2025-12-11 07:15:07'),
(18, 2, 1, 'ыв', 1, '2025-12-11 07:19:43'),
(19, 2, 1, 'ффф', 1, '2025-12-11 07:19:48'),
(20, 1, 2, 'аа', 1, '2025-12-11 07:19:50'),
(21, 1, 2, 'ы', 1, '2025-12-11 07:19:54'),
(22, 1, 2, 'а', 1, '2025-12-11 07:20:30'),
(23, 2, 1, 'пваап', 1, '2025-12-11 07:20:40'),
(24, 2, 1, 'ы', 1, '2025-12-11 07:21:39'),
(25, 1, 2, 'аывафыва', 1, '2025-12-11 07:21:50'),
(26, 1, 2, 's', 1, '2025-12-12 07:47:30'),
(27, 2, 1, 's', 1, '2025-12-12 07:47:35'),
(28, 2, 1, 'fsdf', 1, '2025-12-12 07:47:40'),
(29, 1, 2, 'adsd', 1, '2025-12-12 07:47:48'),
(30, 2, 1, 'asda', 1, '2025-12-12 07:47:52'),
(31, 1, 2, 'asd', 1, '2025-12-12 07:48:04'),
(32, 2, 1, 'jopa', 1, '2025-12-12 07:56:56'),
(33, 2, 1, 'piska', 1, '2025-12-12 07:57:02'),
(34, 1, 2, 'xuy', 1, '2025-12-12 07:57:07'),
(35, 2, 1, 'xuy', 1, '2025-12-12 07:57:11'),
(36, 1, 2, 'вфыв', 1, '2025-12-12 08:00:27'),
(37, 1, 2, 'asd', 1, '2025-12-12 08:09:48'),
(38, 1, 2, 'asd', 1, '2025-12-12 08:10:04'),
(39, 1, 2, 'asda', 1, '2025-12-12 08:10:18'),
(40, 2, 1, 's', 1, '2025-12-12 08:23:37'),
(41, 1, 2, 'fdsf', 1, '2025-12-12 08:23:40'),
(42, 1, 2, 'asdasd', 1, '2025-12-12 08:23:45'),
(43, 2, 1, 'dfsgsdg', 1, '2025-12-12 08:23:47'),
(44, 2, 1, 'asdA', 1, '2025-12-12 08:23:51'),
(45, 2, 1, 'fgnbx', 1, '2025-12-12 08:31:48'),
(46, 1, 2, 'jopa', 1, '2025-12-12 08:31:52'),
(47, 1, 2, 'piska', 1, '2025-12-12 08:32:01'),
(48, 1, 2, 'jopa', 1, '2025-12-12 08:32:06'),
(49, 1, 2, 'xuy', 1, '2025-12-12 08:32:11'),
(50, 2, 1, 'xuy', 1, '2025-12-12 08:32:28'),
(51, 2, 1, 'xuy', 1, '2025-12-12 08:32:34'),
(52, 2, 1, 'asdAFDf', 1, '2025-12-12 08:32:52'),
(53, 2, 1, 'xuy', 1, '2025-12-12 08:33:09'),
(54, 2, 1, 'jpa', 1, '2025-12-12 08:33:16'),
(55, 1, 2, 'jopa', 1, '2025-12-12 08:33:19'),
(56, 1, 2, 'xuy', 1, '2025-12-12 08:33:36'),
(57, 1, 2, 'asdasd', 1, '2025-12-12 08:33:39'),
(58, 1, 2, 'xy', 1, '2025-12-12 08:34:11'),
(59, 1, 2, 'sfdsf', 1, '2025-12-12 08:34:13'),
(60, 1, 2, 'afdD', 1, '2025-12-12 08:34:18'),
(61, 1, 2, 'фывфы', 1, '2025-12-12 08:35:41'),
(62, 1, 2, 'asdasd', 1, '2025-12-12 08:54:26'),
(63, 1, 2, 'fdsaf', 1, '2025-12-12 08:54:37'),
(64, 1, 2, 'xzvcvzxv', 1, '2025-12-12 08:54:44'),
(65, 2, 1, 'жопа', 1, '2025-12-12 08:55:21'),
(66, 1, 2, 'йцуйцу', 1, '2025-12-12 08:55:27'),
(67, 2, 1, 'фвфыв', 1, '2025-12-12 08:55:30'),
(68, 1, 2, 'вапрывар', 1, '2025-12-12 08:55:37'),
(69, 2, 1, 'фывыфвф', 1, '2025-12-12 08:55:42'),
(70, 1, 2, 'вапыв', 1, '2025-12-12 08:55:46'),
(71, 2, 1, 'adfaf', 1, '2025-12-12 08:58:58'),
(72, 1, 2, 'adad', 1, '2025-12-12 08:59:00'),
(73, 2, 1, 'sfgagsdg', 1, '2025-12-12 08:59:07'),
(74, 1, 2, 'adsasd', 1, '2025-12-12 08:59:08'),
(75, 1, 2, 'sfasf', 1, '2025-12-12 09:06:54'),
(76, 2, 1, 'qweqweqw', 1, '2025-12-12 09:07:06'),
(77, 2, 1, 'adasd', 1, '2025-12-12 09:07:11'),
(78, 1, 2, 'jopa', 1, '2025-12-12 09:07:14'),
(79, 1, 2, 'piska', 1, '2025-12-12 09:07:40'),
(80, 2, 1, 'xuy', 1, '2025-12-12 09:07:47'),
(81, 1, 2, 'jopa', 1, '2025-12-17 12:33:51'),
(82, 2, 1, 'piska', 1, '2025-12-17 12:33:54'),
(83, 1, 2, '11234123', 1, '2025-12-19 11:31:16'),
(84, 2, 1, '1234', 1, '2025-12-19 11:31:28'),
(85, 2, 1, 'хуй', 1, '2025-12-22 19:31:22'),
(86, 2, 1, 'фвыфв', 1, '2025-12-22 19:31:26'),
(87, 1, 2, ';jgf', 1, '2025-12-22 19:38:43'),
(88, 1, 2, 'jopa', 1, '2025-12-22 19:49:18'),
(89, 1, 2, 'хуй', 1, '2025-12-22 19:53:25'),
(90, 1, 2, 'хуй', 1, '2025-12-22 19:53:49'),
(91, 1, 2, 'фывфв', 1, '2025-12-22 19:53:55'),
(92, 1, 2, 'ощзф', 1, '2025-12-23 14:47:01'),
(93, 1, 2, 'фывф', 1, '2025-12-23 14:48:40'),
(94, 1, 2, 'asdasd', 1, '2025-12-23 14:58:15'),
(95, 2, 1, 'asdasd', 1, '2025-12-23 14:58:30'),
(96, 2, 1, 'asdasd', 1, '2025-12-23 14:58:42'),
(97, 2, 1, 'sdfgsdfg', 1, '2025-12-23 14:58:44'),
(98, 2, 1, 'asdasdsad', 1, '2025-12-23 14:58:56'),
(99, 1, 2, 'asd', 1, '2025-12-23 14:59:24'),
(100, 2, 1, 'adasd', 1, '2025-12-23 15:04:09'),
(101, 1, 2, 'asd', 1, '2025-12-23 15:04:18'),
(102, 1, 2, 'dsfasdf', 1, '2025-12-23 15:04:21'),
(103, 1, 2, 'фывфы', 1, '2025-12-23 15:06:45'),
(104, 1, 2, 'фывфыв', 1, '2025-12-23 15:07:40'),
(105, 1, 2, 'фывфывф', 1, '2025-12-23 15:09:20'),
(106, 1, 2, 'asdsadad', 1, '2025-12-23 15:10:38'),
(107, 1, 2, 'qeqweqwe', 1, '2025-12-23 15:10:40'),
(108, 2, 1, 'asdsad', 1, '2025-12-23 15:10:49'),
(109, 1, 2, 'qwewqeq', 1, '2025-12-23 15:10:51'),
(110, 1, 2, 'asdfasfgasdfg', 1, '2025-12-23 15:10:58'),
(111, 2, 1, 'adasd', 1, '2025-12-23 15:11:02'),
(112, 1, 2, 'asdasdas', 1, '2025-12-23 15:11:12'),
(113, 1, 2, 'sfasfasf', 1, '2025-12-23 15:11:15'),
(114, 1, 2, 'asdsad', 1, '2025-12-23 15:13:01'),
(115, 1, 2, 'asdasd', 1, '2025-12-23 15:13:10'),
(116, 1, 2, 'asdasd', 1, '2025-12-23 15:13:17'),
(117, 1, 2, 'dfgsdgsdg', 1, '2025-12-23 15:13:20'),
(118, 2, 1, 'asd', 1, '2025-12-23 15:13:26'),
(119, 1, 2, 'asdasdasd', 1, '2025-12-23 15:15:52'),
(120, 2, 1, 'asdsad', 1, '2025-12-23 15:16:01'),
(121, 1, 2, 'фывфыв', 1, '2025-12-23 17:04:02'),
(122, 2, 1, 'фывыфв', 1, '2025-12-23 17:04:09'),
(123, 1, 2, 'вфывф', 1, '2025-12-23 17:04:22'),
(124, 2, 1, 'фывфывфы', 1, '2025-12-23 17:04:27'),
(125, 2, 1, 'фывфывф', 1, '2025-12-23 17:04:40'),
(126, 1, 2, 'фывыфв', 1, '2025-12-23 17:04:43'),
(127, 2, 1, 'апфп', 1, '2025-12-23 17:04:46'),
(128, 1, 2, 'фывыфв', 1, '2025-12-23 17:04:48'),
(129, 1, 2, 'sfasf', 1, '2025-12-24 19:22:56'),
(130, 2, 1, 'adASD', 1, '2025-12-24 19:23:36'),
(131, 1, 2, 'asdsa', 1, '2025-12-24 19:23:54'),
(132, 1, 2, 'sfasdfa', 1, '2025-12-24 19:24:03'),
(133, 1, 2, 'fasdfa', 1, '2025-12-24 19:24:07'),
(134, 1, 2, 'asdasd', 1, '2025-12-24 19:25:47'),
(135, 1, 2, 'adasda', 1, '2025-12-24 19:25:56'),
(136, 1, 2, 'asdasda', 1, '2025-12-24 19:26:05'),
(137, 1, 2, 'sdad', 1, '2025-12-24 19:26:12'),
(138, 1, 2, 'хуй', 1, '2025-12-24 20:03:28'),
(139, 1, 2, '[peq', 1, '2025-12-24 20:04:21'),
(140, 1, 2, 'dsadas', 1, '2025-12-25 23:56:26'),
(141, 1, 2, 'asdasd', 1, '2025-12-25 23:58:06'),
(142, 1, 2, 'gfghdf', 1, '2025-12-25 23:58:11'),
(143, 1, 2, 'asdasd', 1, '2025-12-26 00:02:28'),
(144, 1, 2, 'фвфыв', 1, '2025-12-26 00:02:56'),
(145, 1, 2, 'asdasd', 1, '2025-12-26 00:06:04'),
(146, 1, 2, 'fgdfg', 1, '2025-12-26 00:06:09'),
(147, 1, 2, 'asdasd', 1, '2025-12-26 00:09:48'),
(148, 2, 1, 'adsad', 1, '2025-12-26 00:10:15'),
(149, 1, 2, 'фывф', 1, '2025-12-26 00:15:49'),
(150, 2, 1, 'ывыфвф', 1, '2025-12-26 00:15:58'),
(151, 1, 2, 'фывфыв', 1, '2025-12-26 00:16:10'),
(152, 1, 2, 'рпаыв', 1, '2025-12-26 00:18:45'),
(153, 1, 2, 'asd', 1, '2025-12-26 00:21:49'),
(154, 2, 1, 'sada', 1, '2025-12-26 00:21:57'),
(155, 1, 2, 'dfgsdfg', 1, '2025-12-26 00:22:18'),
(156, 2, 1, 'asdsad', 1, '2025-12-26 00:22:25'),
(157, 1, 2, 'фывфыв', 1, '2025-12-26 00:24:02'),
(158, 2, 1, 'фывфыв', 1, '2025-12-26 00:24:15'),
(159, 2, 1, 'фывыф', 1, '2025-12-26 00:28:16'),
(160, 1, 2, 'авыаы', 1, '2025-12-26 00:28:21'),
(161, 2, 1, 'ывфыв', 1, '2025-12-26 00:28:40'),
(162, 1, 2, 'фывфыв', 0, '2025-12-26 00:28:42');

-- SQLINES DEMO *** ---------------------------------------

--
-- SQLINES DEMO ***  `topics`
--

CREATE TABLE topics (
  id int NOT NULL,
  title varchar(255) NOT NULL,
  content text NOT NULL,
  author_id int NOT NULL,
  category_id int NOT NULL,
  is_pinned smallint DEFAULT 0,
  is_locked smallint DEFAULT 0,
  created_at timestamp(0) NOT NULL DEFAULT current_timestamp(),
  updated_at timestamp(0) NOT NULL DEFAULT current_timestamp() /* ON UPDATE current_timestamp() */
) ;

--
-- SQLINES DEMO *** цы `topics`
--

INSERT INTO topics (id, title, content, author_id, category_id, is_pinned, is_locked, created_at, updated_at) VALUES
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

-- SQLINES DEMO *** ---------------------------------------

--
-- SQLINES DEMO ***  `users`
--

CREATE TABLE users (
  id int NOT NULL,
  login varchar(255) NOT NULL,
  email varchar(255) NOT NULL,
  password_hash varchar(255) NOT NULL,
  verification_code varchar(10) DEFAULT NULL,
  is_verified smallint DEFAULT 0,
  created_at timestamp(0) NOT NULL DEFAULT current_timestamp(),
  avatar varchar(255) DEFAULT NULL
) ;

--
-- SQLINES DEMO *** цы `users`
--

INSERT INTO users (id, login, email, password_hash, verification_code, is_verified, created_at, avatar) VALUES
(1, 'Ukeo', 'shadowroyaletv@gmail.com', '$2b$10$tCJMzwhOsuzSdPaKuKECd.GG3/oecyw0P2jul1bQULvzXIedc3UIG', NULL, 1, '2025-11-17 03:47:42', 'http://localhost:3000/assets/avatars/avatar-1764873864458-41615712.jpg'),
(2, 'Kirigami', 'yukeosk@gmail.com', '$2b$10$pTzWSzDt9h4MQfWKW91xBeQ.nz.ZcFP87L52MtM1dpPF1TrEzjfEe', NULL, 1, '2025-12-08 01:41:37', NULL),
(3, 'timur', 'timurleonbutov@gmail.com', '$2b$10$MpIhng06XdWVgbecUTHS4.UEQqstzB7KVR0bShq9yAHdswO6R7yt6', NULL, 1, '2025-12-16 12:48:56', NULL);

--
-- SQLINES DEMO *** ых таблиц
--

--
-- SQLINES DEMO *** categories`
--
ALTER TABLE categories
  ADD PRIMARY KEY (id),
  ADD UNIQUE KEY name (name);

--
-- SQLINES DEMO *** friendships`
--
ALTER TABLE friendships
  ADD PRIMARY KEY (id),
  ADD UNIQUE KEY unique_friendship (user_id,friend_id),
  ADD KEY friend_id (friend_id);

--
-- SQLINES DEMO *** posts`
--
ALTER TABLE posts
  ADD PRIMARY KEY (id),
  ADD KEY author_id (author_id),
  ADD KEY topic_id (topic_id),
  ADD KEY parent_post_id (parent_post_id);

--
-- SQLINES DEMO *** post_reactions`
--
ALTER TABLE post_reactions
  ADD PRIMARY KEY (id),
  ADD UNIQUE KEY unique_reaction (post_id,user_id,reaction_type),
  ADD KEY user_id (user_id);

--
-- SQLINES DEMO *** private_messages`
--
ALTER TABLE private_messages
  ADD PRIMARY KEY (id),
  ADD KEY idx_sender_receiver (sender_id,receiver_id,created_at),
  ADD KEY idx_receiver_sender (receiver_id,sender_id,created_at);

--
-- SQLINES DEMO *** topics`
--
ALTER TABLE topics
  ADD PRIMARY KEY (id),
  ADD KEY author_id (author_id),
  ADD KEY category_id (category_id);

--
-- SQLINES DEMO *** users`
--
ALTER TABLE users
  ADD PRIMARY KEY (id),
  ADD UNIQUE KEY login (login),
  ADD UNIQUE KEY email (email);

--
-- SQLINES DEMO *** я сохранённых таблиц
--

--
-- SQLINES DEMO *** я таблицы `categories`
--
ALTER TABLE categories
  MODIFY id int NOT NULL GENERATED ALWAYS AS IDENTITY, AUTO_INCREMENT=21;

--
-- SQLINES DEMO *** я таблицы `friendships`
--
ALTER TABLE friendships
  MODIFY id int NOT NULL GENERATED ALWAYS AS IDENTITY, AUTO_INCREMENT=3;

--
-- SQLINES DEMO *** я таблицы `posts`
--
ALTER TABLE posts
  MODIFY id int NOT NULL GENERATED ALWAYS AS IDENTITY, AUTO_INCREMENT=15;

--
-- SQLINES DEMO *** я таблицы `post_reactions`
--
ALTER TABLE post_reactions
  MODIFY id int NOT NULL GENERATED ALWAYS AS IDENTITY, AUTO_INCREMENT=21;

--
-- SQLINES DEMO *** я таблицы `private_messages`
--
ALTER TABLE private_messages
  MODIFY id int NOT NULL GENERATED ALWAYS AS IDENTITY, AUTO_INCREMENT=163;

--
-- SQLINES DEMO *** я таблицы `topics`
--
ALTER TABLE topics
  MODIFY id int NOT NULL GENERATED ALWAYS AS IDENTITY, AUTO_INCREMENT=13;

--
-- SQLINES DEMO *** я таблицы `users`
--
ALTER TABLE users
  MODIFY id int NOT NULL GENERATED ALWAYS AS IDENTITY, AUTO_INCREMENT=4;

--
-- SQLINES DEMO *** его ключа сохраненных таблиц
--

--
-- SQLINES DEMO *** его ключа таблицы `friendships`
--
ALTER TABLE friendships
  ADD CONSTRAINT friendships_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  ADD CONSTRAINT friendships_ibfk_2 FOREIGN KEY (friend_id) REFERENCES users (id) ON DELETE CASCADE;

--
-- SQLINES DEMO *** его ключа таблицы `posts`
--
ALTER TABLE posts
  ADD CONSTRAINT posts_ibfk_1 FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE CASCADE,
  ADD CONSTRAINT posts_ibfk_2 FOREIGN KEY (topic_id) REFERENCES topics (id) ON DELETE CASCADE,
  ADD CONSTRAINT posts_ibfk_3 FOREIGN KEY (parent_post_id) REFERENCES posts (id);

--
-- SQLINES DEMO *** его ключа таблицы `post_reactions`
--
ALTER TABLE post_reactions
  ADD CONSTRAINT post_reactions_ibfk_1 FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
  ADD CONSTRAINT post_reactions_ibfk_2 FOREIGN KEY (user_id) REFERENCES users (id);

--
-- SQLINES DEMO *** его ключа таблицы `private_messages`
--
ALTER TABLE private_messages
  ADD CONSTRAINT private_messages_ibfk_1 FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE,
  ADD CONSTRAINT private_messages_ibfk_2 FOREIGN KEY (receiver_id) REFERENCES users (id) ON DELETE CASCADE;

--
-- SQLINES DEMO *** его ключа таблицы `topics`
--
ALTER TABLE topics
  ADD CONSTRAINT topics_ibfk_1 FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE CASCADE,
  ADD CONSTRAINT topics_ibfk_2 FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE;
COMMIT;

/* SQLINES DEMO *** CTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/* SQLINES DEMO *** CTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/* SQLINES DEMO *** TION_CONNECTION=@OLD_COLLATION_CONNECTION */;
