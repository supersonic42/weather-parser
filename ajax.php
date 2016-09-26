<?php

function queryVar($key, $default = null)
{
	if (isset($_GET[$key]))
	{
		$val = $_GET[$key];
	}
	else if (isset($_POST[$key]))
	{
		$val = $_POST[$key];
	}
	else
	{
		$val = $default;
	}

	return $val;
}

$root   = __DIR__;
$oper   = queryVar('oper');
$res    = ['state' => 'err'];

switch ($oper)
{
    case 'corsGate':
        if (queryVar('url') && filter_var(queryVar('url'), FILTER_VALIDATE_URL))
        {
            $content = file_get_contents(queryVar('url'));

            if ($content)
            {
                $res['state']   = 'ok';
                $res['content'] = $content;
            }
        }
        break;
    
    case 'writeInfoToFile':
        if (queryVar('data'))
        {
            $dataDir = $root . '/data';
            
            if (!is_dir($dataDir))
            {
                mkdir($dataDir, 0777);
            }
            
            file_put_contents($dataDir . '/week', queryVar('data'));
            
            $res['state'] = 'ok';
        }
        break;
    
    case 'loadWeatherInfo':
        if (is_file($root . '/data/week'))
        {
            $res['weatherInfo'] = json_decode(file_get_contents($root . '/data/week'), true);
            $res['state']       = 'ok';
        }
        break;
}

echo json_encode($res);
