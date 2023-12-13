<?PHP

function jr_read_json($path,$num){
	$filename=$path . '/' . intdiv($num , 1000) . '/' . $num . '.json';
	if (!file_exists($filename)) return null;
	return json_decode(file_get_contents($filename),false);
}

function jr_add_arrays(&$target,&$new){
	$i=0;
	while ($i<count($target) and $i<count($new)){
		if (!is_float($new[$i]) and !is_int($new[$i])) $new[$i]=0;
		if (!is_float($target[$i]) and !is_int($target[$i])) $target[$i]=0;
		$target[$i]=$target[$i]+$new[$i];
		$i++;
	}
}

function jr_add_objects(&$target,&$new){
	$keys=array();
	foreach($target as $key => &$value){
		if(!is_float($value) and !is_int($value)) $value=0;
		$keys[]=$key;
	}
	foreach($new as $key => &$value){
		if(!is_float($value) and !is_int($value)) $value=0;
		$keys[]=$key;
	}
	$keys=array_unique($keys);
	$key=array_pop($keys);
	while(null!==$key){
		if(!property_exists($target,$key)){
			$target->$key=0;
		}
		if(property_exists($new,$key)){
			$target->$key+=$new->$key;
		}
		$key=array_pop($keys);
	}
}

function jr_add(&$target,&$item){
	foreach($item as $key => &$value){
		$target_value=null;
		if (property_exists($target,$key)) $target_value=$target->$key;
		if (is_float($value) or is_int($value)){
			// numbers: add them if present
			if(is_float($target_value) or is_int($target_value)){
				$target->$key+=$value;
			}else{
				$target->$key=$value;
			}
			continue;
		}
		if (is_string($value)){
			// strings: if not equal, set empty
			if($target_value!==$value) $target->$key='';
			continue;
		}
		if (is_array($value)){
			// arrays: add element-wise
			if(!is_array($target_value)) $target->$key=array_fill(0,count($value),0);
			jr_add_arrays($target->$key,$value);
			continue;
		}
		if (is_object($value)){
			// objects: merge and add entries
			if(!is_object($target_value)) $target->$key=(object)[];
			jr_add_objects($target->$key,$value);
			continue;
		}
	}
	// strings: if item does not have the property, set empty string on target
	foreach($target as $key => &$value){
		if(is_string($value)){
			if(!property_exists($item,$key)){
				$value='';
			}
		}
	}
}

function jr_get_grouping($item,$grouper){
	$res='';
	foreach ($grouper as $attr){
		$tmp = jr_get_prop($item,$attr);
		if (is_string($tmp)) $res.=$tmp;
		if (is_float($tmp) or is_int($tmp)) $res.=sprintf('%E',$tmp);
		$res .=chr(124);
	}
	return rtrim($res,chr(124));
}

function jr_get_grouper($spec){
	$res=null;
	if (null!==$spec) $res=jr_get_prop($spec,'grouping');
	if (null===$res) return array('sub_portfolio');
	return $res;
}

function jr_append(&$items,&$collection,&$index,$grouper){
	// add all items  item to aggregated $collection of results, using $index for quick discovery of items to aggregate
	$item=array_pop($items);
	while (null!==$item){
		$grouping=jr_get_grouping($item,$grouper);
		$item->_grouping=$grouping;
		
		if(array_key_exists($grouping,$index)){
			// key exists already, must aggregate new item onto existing item
			$target=$index[$grouping];
			jr_add($target,$item);
		}else{
			// new key, just add item
			$collection[]=$item;
			$index[$grouping]=$item;
		}
		$item=array_pop($items);
	}
}

function jr_aggregate($path,$spec,$start,$incr){ // aggregate results from directory
	$res=array();
	$index=array();
	$items=null;
	$grouper=jr_get_grouper($spec);
	for ($i=$start;;$i+=$incr){
		$items=jr_read_json($path,$i);
		if (null===$items) break;
		jr_append($items,$res,$index,$grouper);
	}
	return $res;
}

