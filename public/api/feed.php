<?php
/**
 * Отдаёт XML-фид товаров лендингов по адресу https://pack.t-sib.ru/feed.xml
 * Данные берёт из облачной функции и кеширует на диске: свежая копия
 * запрашивается не чаще раза в 5 минут, а при недоступности источника
 * отдаётся последняя удачная версия.
 */

$SOURCE = 'https://functions.poehali.dev/9684a3e5-bba2-413b-9b77-f0bc4b2a7db2';
$CACHE_FILE = sys_get_temp_dir() . '/pack_landing_feed.xml';
$CACHE_TTL = 300;

$page = isset($_GET['page']) ? trim($_GET['page']) : '';
$refresh = isset($_GET['refresh']) && in_array(strtolower($_GET['refresh']), ['1', 'true', 'yes'], true);

$url = $SOURCE;
$query = [];
if ($page !== '') {
    $query['page'] = $page;
}
if ($refresh) {
    $query['refresh'] = '1';
}
if ($query) {
    $url .= '?' . http_build_query($query);
}

$useCache = ($page === '' && !$refresh);

if ($useCache && is_readable($CACHE_FILE) && (time() - filemtime($CACHE_FILE)) < $CACHE_TTL) {
    header('Content-Type: application/xml; charset=utf-8');
    header('Cache-Control: public, max-age=' . $CACHE_TTL);
    readfile($CACHE_FILE);
    exit;
}

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT => 60,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_USERAGENT => 'pack.t-sib.ru feed proxy',
]);
$body = curl_exec($ch);
$code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($code === 200 && $body !== false && strlen($body) > 100) {
    if ($useCache) {
        @file_put_contents($CACHE_FILE, $body, LOCK_EX);
    }
    header('Content-Type: application/xml; charset=utf-8');
    header('Cache-Control: public, max-age=' . $CACHE_TTL);
    echo $body;
    exit;
}

if (is_readable($CACHE_FILE)) {
    header('Content-Type: application/xml; charset=utf-8');
    header('Cache-Control: public, max-age=60');
    readfile($CACHE_FILE);
    exit;
}

http_response_code(503);
header('Content-Type: application/xml; charset=utf-8');
echo '<?xml version="1.0" encoding="UTF-8"?><error>feed temporarily unavailable</error>';
