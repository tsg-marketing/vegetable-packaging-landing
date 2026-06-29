<?php
/**
 * Приёмник заявок с сайта Техно-Сиб.
 * Получает JSON, валидирует, передаёт в Bitrix24 (вебхук задаётся на стороне сервера).
 *
 * Конфигурация (на боевом сервере):
 *   - Создайте файл /api/b24-config.php, который НЕ коммитится в репо, со строкой:
 *       <?php $B24_WEBHOOK_URL = 'https://your-portal.bitrix24.ru/rest/USER_ID/TOKEN/';
 *   - Либо задайте переменную окружения B24_WEBHOOK_URL.
 *
 * Секрет Bitrix24 ни в коде, ни во фронте не хранится.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid JSON']);
    exit;
}

// ── Валидация ───────────────────────────────────────────────
$name  = trim((string)($data['name']  ?? ''));
$phone = trim((string)($data['phone'] ?? ''));
$email = trim((string)($data['email'] ?? ''));

if ($name === '' || mb_strlen($name) < 2) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Имя не заполнено']);
    exit;
}
$phoneDigits = preg_replace('/\D+/', '', $phone);
if (strlen($phoneDigits) < 10 || strlen($phoneDigits) > 11) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Неверный телефон']);
    exit;
}

$product = trim((string)($data['product'] ?? ''));
$comment = trim((string)($data['comment'] ?? ''));
$pack    = trim((string)($data['pack']    ?? ''));
$source  = trim((string)($data['source']  ?? 'site'));
$pageUrl = trim((string)($data['pageUrl'] ?? ''));
$page    = trim((string)($data['page']    ?? ''));

// Полный URL страницы, откуда пришла заявка (например https://pack.t-sib.ru/gorizontalnoe)
$leadUrl = $pageUrl;
if ($leadUrl === '' && $page !== '') {
    $leadUrl = 'https://pack.t-sib.ru' . ($page[0] === '/' ? $page : '/' . $page);
}

// Ответы квиза (произвольный набор полей: товар, размер, скорость, объём и т.д.)
$quizAnswers = isset($data['quizAnswers']) && is_array($data['quizAnswers']) ? $data['quizAnswers'] : [];
$quizClean = [];
foreach ($quizAnswers as $k => $v) {
    if (is_scalar($v) && trim((string)$v) !== '') {
        $quizClean[(string)$k] = mb_substr((string)$v, 0, 500);
    }
}

// UTM
$utm = isset($data['utm']) && is_array($data['utm']) ? $data['utm'] : [];
$utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
$utmClean = [];
foreach ($utmKeys as $k) {
    if (!empty($utm[$k])) {
        $utmClean[$k] = mb_substr((string)$utm[$k], 0, 250);
    }
}

// ── Формируем title и комментарий ───────────────────────────
$title = 'Заявка с сайта';
if ($product !== '') {
    $title .= ' — ' . mb_substr($product, 0, 150);
} elseif ($pack !== '') {
    $title .= ' — ' . mb_substr($pack, 0, 150);
}

$quizLabels = [
    'product'    => 'Что упаковываете',
    'packaging'  => 'Тип упаковки',
    'volume'     => 'Объём',
    'automation' => 'Автоматизация',
    'size'       => 'Размер',
    'speed'      => 'Скорость',
    'budget'     => 'Бюджет',
    'task'       => 'Задача',
    'options'    => 'Доп. опции',
];

$commentLines = [];
if ($product !== '')  $commentLines[] = 'Товар: ' . $product;
if ($pack !== '')     $commentLines[] = 'Что упаковывают: ' . $pack;
if ($comment !== '')  $commentLines[] = 'Комментарий: ' . $comment;
if ($email !== '')    $commentLines[] = 'E-mail: ' . $email;
if (!empty($quizClean)) {
    $commentLines[] = '— Ответы квиза —';
    foreach ($quizClean as $k => $v) {
        $commentLines[] = ($quizLabels[$k] ?? $k) . ': ' . $v;
    }
}
if ($leadUrl !== '')  $commentLines[] = 'Страница: ' . $leadUrl;
if (!empty($utmClean)) {
    $commentLines[] = '— UTM —';
    foreach ($utmClean as $k => $v) {
        $commentLines[] = $k . ': ' . $v;
    }
}
$commentText = implode("\n", $commentLines);

// Имя для CRM: "{имя} — {url страницы}" (например "Иван — https://pack.t-sib.ru/gorizontalnoe")
$nameForCrm = $name;
if ($leadUrl !== '') {
    $nameForCrm = $name . ' — ' . $leadUrl;
}

// ── Логирование на диск (на случай сбоя webhook) ────────────
$logDir  = __DIR__ . '/leads';
if (!is_dir($logDir)) @mkdir($logDir, 0775, true);
$logFile = $logDir . '/' . date('Y-m') . '.log';
$logLine = '[' . date('Y-m-d H:i:s') . '] ' . json_encode([
    'name'        => $name,
    'phone'       => $phone,
    'email'       => $email,
    'source'      => $source,
    'product'     => $product,
    'pack'        => $pack,
    'comment'     => $comment,
    'quizAnswers' => $quizClean,
    'url'         => $leadUrl,
    'page'        => $page,
    'utm'         => $utmClean,
    'ip'          => $_SERVER['REMOTE_ADDR'] ?? '',
], JSON_UNESCAPED_UNICODE) . "\n";
@file_put_contents($logFile, $logLine, FILE_APPEND | LOCK_EX);

// ── Загружаем секрет (только серверная сторона) ─────────────
$B24_WEBHOOK_URL = '';
if (file_exists(__DIR__ . '/b24-config.php')) {
    include __DIR__ . '/b24-config.php';
}
if ($B24_WEBHOOK_URL === '' && getenv('B24_WEBHOOK_URL')) {
    $B24_WEBHOOK_URL = getenv('B24_WEBHOOK_URL');
}

// Если webhook не настроен — заявка всё равно сохранена в лог, отвечаем OK
if ($B24_WEBHOOK_URL === '') {
    echo json_encode(['ok' => true, 'queued' => true]);
    exit;
}

// ── Отправка в Bitrix24 ────────────────────────────────────
$fields = [
    'fields' => [
        'TITLE'        => $title,
        'NAME'         => $nameForCrm,
        'PHONE'        => [['VALUE' => $phone, 'VALUE_TYPE' => 'WORK']],
        'EMAIL'        => $email !== '' ? [['VALUE' => $email, 'VALUE_TYPE' => 'WORK']] : [],
        'COMMENTS'     => $commentText,
        'SOURCE_ID'    => 'WEB',
        'SOURCE_DESCRIPTION' => $source,
        'UTM_SOURCE'   => $utmClean['utm_source']   ?? '',
        'UTM_MEDIUM'   => $utmClean['utm_medium']   ?? '',
        'UTM_CAMPAIGN' => $utmClean['utm_campaign'] ?? '',
        'UTM_CONTENT'  => $utmClean['utm_content']  ?? '',
        'UTM_TERM'     => $utmClean['utm_term']     ?? '',
    ],
    'params' => ['REGISTER_SONET_EVENT' => 'Y'],
];

$url = rtrim($B24_WEBHOOK_URL, '/') . '/crm.lead.add.json';
$ch  = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => json_encode($fields, JSON_UNESCAPED_UNICODE),
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 15,
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr  = curl_error($ch);
curl_close($ch);

if ($curlErr || $httpCode >= 400) {
    @file_put_contents($logFile, '[ERROR ' . date('H:i:s') . '] ' . $curlErr . ' http=' . $httpCode . ' resp=' . substr((string)$response, 0, 500) . "\n", FILE_APPEND | LOCK_EX);
    // Заявка сохранена локально — всё равно отвечаем OK пользователю
    echo json_encode(['ok' => true, 'queued' => true]);
    exit;
}

echo json_encode(['ok' => true]);