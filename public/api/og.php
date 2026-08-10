<?php
/**
 * Отдаёт превью-разметку (Open Graph) для ботов мессенджеров и соцсетей.
 * Боты не выполняют JavaScript, поэтому SPA-мета им недоступны — этот файл
 * возвращает статический HTML с корректными заголовком, описанием и картинкой
 * для конкретной страницы. Живые пользователи сюда не попадают (см. .htaccess).
 */

header('Content-Type: text/html; charset=utf-8');

$SITE_URL = 'https://pack.t-sib.ru';
$LOGO = 'https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/bucket';

$PAGES = [
    '/' => [
        'title' => 'Техно-Сиб — упаковочное оборудование для пищевых производств',
        'description' => 'Производство и поставка упаковочного оборудования: вакуумные, термоусадочные, горизонтальные, картонажные машины и запайщики лотков. Подбор за 1 день, гарантия, сервис.',
        'image' => 'https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/bucket/6987fa02-cd88-4e57-944b-bcaecae0723b.png',
    ],
    '/vegetables' => [
        'title' => 'Оборудование для упаковки овощей и фруктов в сетку и лотки — Техно-Сиб',
        'description' => 'Клипсаторы и автоматические линии для упаковки овощей и фруктов в сетку, плёнку и лотки. Встроенная маркировка для сетей. Подбор за 1 день, гарантия 12 мес.',
        'image' => 'https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/bucket/22bbdae7-6281-4ea3-9e01-c96ce393f30f.png',
    ],
    '/vacuum' => [
        'title' => 'Вакуумные упаковщики — настольные и напольные вакуум-машины | Техно-Сиб',
        'description' => 'Вакуумное упаковочное оборудование: одно- и двухкамерные настольные и напольные упаковщики. Герметичный шов 3,5 мм для пищевых, медицинских и промышленных товаров.',
        'image' => 'https://cdn.poehali.dev/files/4636d5a7-aed0-42a8-9883-c7efdaac6536.png',
    ],
    '/gorizontalnoe' => [
        'title' => 'Горизонтальные упаковочные машины flow-pack — флоупак | Техно-Сиб',
        'description' => 'Горизонтальные упаковочные машины flow-pack: скорость до 330 уп/мин, плёнка 180–950 мм. Упаковка кондитерки, хлеба, зелени, замороженных и непищевых товаров.',
        'image' => 'https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/files/e0d32b09-ff0b-4093-8fe4-1bb4733d849b.jpg',
    ],
    '/kartonajnoe' => [
        'title' => 'Картонажное оборудование — формирователи и заклейщики коробов | Техно-Сиб',
        'description' => 'Картонажное упаковочное оборудование: формирователи и заклейщики коробов до 50 коробов/мин. Короба от 130×80 до 850×600 мм. Для маркетплейсов, e-commerce и логистики.',
        'image' => 'https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/bucket/e080e415-acc2-4182-8331-888da44fa6e4.jpg',
    ],
    '/obanderolivanie' => [
        'title' => 'Оборудование для обвязки мягкими лентами и картонной обечайкой | Техно-Сиб',
        'description' => 'Обандероливающие машины и автоматы для упаковки в картонную обечайку: WK02-30, BM30, HL-228, S-60, W-80. От настольных мини-моделей до автоматических линий. Гарантия 12 мес.',
        'image' => 'https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/bucket/fb95c3ad-3bfd-405e-940c-a6851562a7ec.png',
    ],
    '/termousadka' => [
        'title' => 'Термоусадочное оборудование — купить термоусадочную машину | Техно-Сиб',
        'description' => 'Термоусадочное оборудование до 3 600 упаковок в час: аппараты для штучной и групповой упаковки, термотоннели, термоусадочные танки, термоформеры. Плёнка ПОФ, ПВХ, ПВД.',
        'image' => 'https://cdn.poehali.dev/projects/3f792b21-d338-4186-a2a6-6c21df1b4449/bucket/fb8efd8b-405d-46d4-8511-ad9d9dedf599.png',
    ],
    '/traysealers' => [
        'title' => 'Запайщики лотков (трейсилеры) — купить запайщик лотков | Техно-Сиб',
        'description' => 'Запайщики лотков до 3 600 упаковок в час: автоматические, полуавтоматические и ручные трейсилеры. Запайка в вакуум, газ (MAP), скин. Гарантия 12 месяцев, доставка по РФ и СНГ.',
        'image' => 'https://cdn.poehali.dev/projects/7f0941a7-b646-4462-83cf-d72a4486c6fc/bucket/8130b6af-c559-48ae-9b19-04d134f719e7.png',
    ],
];

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$path = rtrim((string)$path, '/');
if ($path === '') $path = '/';

$meta = $PAGES[$path] ?? $PAGES['/'];
$url = $SITE_URL . ($path === '/' ? '/' : $path);

$t = htmlspecialchars($meta['title'], ENT_QUOTES, 'UTF-8');
$d = htmlspecialchars($meta['description'], ENT_QUOTES, 'UTF-8');
$i = htmlspecialchars($meta['image'], ENT_QUOTES, 'UTF-8');
$u = htmlspecialchars($url, ENT_QUOTES, 'UTF-8');
?><!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title><?= $t ?></title>
<meta name="description" content="<?= $d ?>">
<link rel="canonical" href="<?= $u ?>">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Техно-Сиб">
<meta property="og:locale" content="ru_RU">
<meta property="og:url" content="<?= $u ?>">
<meta property="og:title" content="<?= $t ?>">
<meta property="og:description" content="<?= $d ?>">
<meta property="og:image" content="<?= $i ?>">
<meta property="og:image:alt" content="<?= $t ?>">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="<?= $t ?>">
<meta name="twitter:description" content="<?= $d ?>">
<meta name="twitter:image" content="<?= $i ?>">
</head>
<body>
<h1><?= $t ?></h1>
<p><?= $d ?></p>
<p><a href="<?= $u ?>"><?= $u ?></a></p>
</body>
</html>
