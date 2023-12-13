<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta name="description" content="">
    <meta name="author" content="">
    <link rel="icon" href="/assets/images/favicon.png">


<title><?php echo 'JSON risk - docs - ' . str_replace(".md","",str_replace("_"," ",basename(trim($_SERVER['PATH_INFO'],'/')))); ?></title>
    <!-- Bootstrap core CSS -->
    <link href="/assets/css/bootstrap.min.css" rel="stylesheet">

    <!-- Custom styles for this template -->
    <link href="/assets/css/dashboard.css" rel="stylesheet">

    <!-- Code prettify -->
	<link href="/assets/css/prettify.css" rel="stylesheet">

  </head>

  <?php
				chdir($_SERVER['DOCUMENT_ROOT']);
				// retrieve list of available docs
				$docdir='../docs';
				$dirlist=scandir($docdir);	
				$docs=array();
				foreach ($dirlist as $file){
					if (is_dir($file)) continue;
					if ('.md' !== substr($file,-3)) continue;
					$docs[]=$file;
				}
				//Parsedown library
				include('assets/php/Parsedown.php');
				$Parsedown = new Parsedown();
				//get markdown file content
				$markdown=file_get_contents($docdir . "/" . basename(trim($_SERVER['PATH_INFO'],'/')));
				if (strlen($markdown) == 0) {$markdown=file_get_contents($docdir . "/Overview.md");}	   
  ?>

  <body>
    <nav class="navbar navbar-dark sticky-top bg-dark flex-md-nowrap p-0">
      <a class="navbar-brand col-sm-3 col-md-2 mr-0" href="/">
    			<img src="/assets/images/favicon.png" width="25" height="25" class="d-inline-block align-top" alt="">
    			JSON risk docs
	  </a>
    </nav>

    <div class="container-fluid">
      <div class="row">
        <nav class="col-md-2 d-none d-md-block bg-light sidebar">
          <div class="sidebar-sticky">

            <ul class="nav flex-column mb-2">
			<?php foreach ($docs as $doc){ ?>
              <li class="nav-item">
                <a class="nav-link" href="/docs/<?php echo $doc; ?>">
                  <span data-feather="file-text"></span>
					<?php echo str_replace(".md","",str_replace("_"," ",$doc)); ?>
                </a>
              </li>
			<?php } ?>
            </ul>  
          </div>
        </nav>

        <main role="main" class="col-md-9 ml-sm-auto col-lg-10 pt-3 px-4">
          <?php       	
											echo $Parsedown->text($markdown);
		  					?>
        </main>
      </div>
    </div>

    <!-- Bootstrap core JavaScript
    ================================================== -->
    <!-- Placed at the end of the document so the pages load faster -->
    <script src="/assets/js/jquery-3.2.1.slim.min.js"></script>
    <script src="/assets/js/popper.min.js"></script>
    <script src="/assets/js/bootstrap.min.js"></script>

    <!-- Icons -->
    <script src="/assets/js/feather.min.js"></script>
    <script>
      feather.replace()
    </script>

    <!-- Code formatting -->
	<script src="/assets/js/prettify.js"></script>
	<script type='text/javascript'> 
	window.addEventListener("load", function(event) {
		var prettify = false;
		var blocks = document.querySelectorAll('pre code')
		for (var i = 0; i < blocks.length ; i++) {
		    blocks[i].className += 'prettyprint';
		    prettify = true;
		}
		if (prettify) {
		  prettyPrint();
		}
	});

	window.addEventListener("load", function(event) {
		var tables = document.querySelectorAll('table')
		for (var i = 0; i < tables.length ; i++) {
		    tables[i].className += 'table table-responsive table-hover table-sm';
		}
	});

	</script>

  </body>
</html>
