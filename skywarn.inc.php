<?php
    $status = "0";

    $filename = "skywarn_active.txt";
    if (file_exists($filename)) {
            $myfile = fopen($filename, "r");
            $status = fread($myfile,filesize($filename));
            fclose($myfile);
    } else {
            $status = "0";
    }

    if ($status == "0") {
            $linkText = "Activate Skywarn";
    } else {
            $linkText = "Deactivate Skywarn";
    }

    $btnHtml = "<button id='skywarn' onclick='skywarn_click();'>$linkText</button>";

?>

<script type="text/javascript">
    function skywarn_click() {
            if (confirm("Are you absolutely sure?")) {
                    window.location.href="skywarn_click.php";
            }
    }

    if (window.parent.document.getElementById("lcarsSkywarn")) {
            var ls = window.parent.document.getElementById("lcarsSkywarn");
            ls.href = "javascript:setContent('/totp/auth.php');";
            ls.dataset.label = "<?= $linkText ?>";
    } else {
            document.write("<?= $btnHtml ?>");
    }
</script>