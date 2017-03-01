/*!
 * artTemplate - Template Engine
 * https://github.com/aui/artTemplate
 * Released under the MIT, BSD, and GPL Licenses
 * author: 范成功[二次开发]
 */!(function()
{

	/** 模板引擎
	 * @name    template
	 * @param   {String}            模板名
	 * @param   {Object, String}    数据。如果为字符串则编译并缓存编译结果
	 * @return  {String, Function}  渲染好的HTML字符串或者渲染方法
	 */
	var template = function(filename, content)
	{
		return typeof content === 'string' ? compile(content,
		{
			filename : filename
		}) : renderFile(filename, content);
	};

	template.version = '3.0.0';

	/** 设置全局配置
	 * @name    template.config
	 * @param   {String}    名称
	 * @param   {Any}       值
	 */
	template.config = function(name, value)
	{
		defaults[name] = value;
	};

	var defaults = template.defaults =
	{
		openTag : '<%', // 逻辑语法开始标签
		closeTag : '%>', // 逻辑语法结束标签
		escape : true, // 是否编码输出变量的 HTML 字符
		cache : true, // 是否开启缓存（依赖 options 的 filename 字段）
		compress : false, // 是否压缩输出
		parser : null // 自定义语法格式器 @see: template-syntax.js
	};

	var cacheStore = template.cache =
	{
	};

	/** 渲染模板
	 * @name    template.render
	 * @param   {String}    模板
	 * @param   {Object}    数据
	 * @return  {String}    渲染好的字符串
	 */
	template.render = function(source, options)
	{
		return compile(source, options);
	};

	/** 渲染模板(根据模板名)
	 * @name    template.render
	 * @param   {String}    模板名
	 * @param   {Object}    数据
	 * @return  {String}    渲染好的字符串
	 */
	var renderFile = template.renderFile = function(filename, data)
	{
		var fn = template.get(filename) || showDebugInfo(
		{
			filename : filename,
			name : 'Render Error',
			message : 'Template not found'
		});
		return data ? fn(data) : fn;
	};

	/** 获取编译缓存（可由外部重写此方法）
	 * @param   {String}    模板名
	 * @param   {Function}  编译好的函数
	 */
	template.get = function(filename)
	{

		var cache;

		if (cacheStore[filename])
		{
			// 使用内存缓存
			cache = cacheStore[filename];
		} else if ( typeof document === 'object')
		{
			// 加载模板并编译
			var elem = document.getElementById(filename);

			if (elem)
			{
				var source = (elem.value || elem.innerHTML).replace(/^\s*|\s*$/g, '');
				cache = compile(source,
				{
					filename : filename
				});
			}
		}

		return cache;
	};

	var toString = function(value, type)
	{

		if ( typeof value !== 'string')
		{

			type = typeof value;
			if (type === 'number')
			{
				value += '';
			} else if (type === 'function')
			{
				value = toString(value.call(value));
			} else
			{
				value = '';
			}
		}

		return value;

	};

	var escapeMap =
	{
		"<" : "&#60;",
		">" : "&#62;",
		'"' : "&#34;",
		"'" : "&#39;",
		"&" : "&#38;"
	};

	var escapeFn = function(s)
	{
		return escapeMap[s];
	};

	var escapeHTML = function(content)
	{
		return toString(content).replace(/&(?![\w#]+;)|[<>"']/g, escapeFn);
	};

	var isArray = Array.isArray ||
	function(obj)
	{
		return (
			{
			}).toString.call(obj) === '[object Array]';
	};

	var each = function(data, callback)
	{
		var i, len;
		if (isArray(data))
		{
			for ( i = 0, len = data.length; i < len; i++)
			{
				callback.call(data, data[i], i, data);
			}
		} else
		{
			for (i in data)
			{
				callback.call(data, data[i], i);
			}
		}
	};

	var utils = template.utils =
	{

		$helpers :
		{
		},

		$include : renderFile,

		$string : toString,

		$escape : escapeHTML,

		$each : each

	};
	/** 添加模板辅助方法
	 * @name    template.helper
	 * @param   {String}    名称
	 * @param   {Function}  方法
	 */
	template.helper = function(name, helper)
	{
		helpers[name] = helper;
	};

	var helpers = template.helpers = utils.$helpers;

	/** 模板错误事件（可由外部重写此方法）
	 * @name    template.onerror
	 * @event
	 */
	template.onerror = function(e)
	{
		var message = 'Template Error\n\n';
		for (var name in e)
		{
			message += '<' + name + '>\n' + e[name] + '\n\n';
		}

		if ( typeof console === 'object')
		{
			console.error(message);
		}
	};

	// 模板调试器
	var showDebugInfo = function(e)
	{

		template.onerror(e);

		return function()
		{
			return '{Template Error}';
		};
	};

	/** 编译模板
	 * 2012-6-6 @TooBug: define 方法名改为 compile，与 Node Express 保持一致
	 * @name    template.compile
	 * @param   {String}    模板字符串
	 * @param   {Object}    编译选项
	 *
	 *      - openTag       {String}
	 *      - closeTag      {String}
	 *      - filename      {String}
	 *      - escape        {Boolean}
	 *      - compress      {Boolean}
	 *      - debug         {Boolean}
	 *      - cache         {Boolean}
	 *      - parser        {Function}
	 *
	 * @return  {Function}  渲染方法
	 */
	var compile = template.compile = function(source, options)
	{

		// 合并默认配置
		options = options ||
		{
		};
		for (var name in defaults)
		{
			if (options[name] === undefined)
			{
				options[name] = defaults[name];
			}
		}

		var filename = options.filename;

		try
		{

			var Render = compiler(source, options);

		} catch (e)
		{

			e.filename = filename || 'anonymous';
			e.name = 'Syntax Error';

			return showDebugInfo(e);

		}

		// 对编译结果进行一次包装

		function render(data)
		{

			try
			{

				return new Render(data, filename) + '';

			} catch (e)
			{

				// 运行时出错后自动开启调试模式重新编译
				if (!options.debug)
				{
					options.debug = true;
					return compile(source, options)(data);
				}

				return showDebugInfo(e)();

			}

		}


		render.prototype = Render.prototype;
		render.toString = function()
		{
			return Render.toString();
		};

		if (filename && options.cache)
		{
			cacheStore[filename] = render;
		}

		return render;

	};

	// 数组迭代
	var forEach = utils.$each;

	// 静态分析模板变量
	var KEYWORDS =
	// 关键字
	'break,case,catch,continue,debugger,default,delete,do,else,false' + ',finally,for,function,if,in,instanceof,new,null,return,switch,this' + ',throw,true,try,typeof,var,void,while,with'

	// 保留字
	+ ',abstract,boolean,byte,char,class,const,double,enum,export,extends' + ',final,float,goto,implements,import,int,interface,long,native' + ',package,private,protected,public,short,static,super,synchronized' + ',throws,transient,volatile'

	// ECMA 5 - use strict
	+ ',arguments,let,yield' + ',undefined';

	var REMOVE_RE = /\/\*[\w\W]*?\*\/|\/\/[^\n]*\n|\/\/[^\n]*$|"(?:[^"\\]|\\[\w\W])*"|'(?:[^'\\]|\\[\w\W])*'|\s*\.\s*[$\w\.]+/g;
	var SPLIT_RE = /[^\w$]+/g;
	var KEYWORDS_RE = new RegExp(["\\b" + KEYWORDS.replace(/,/g, '\\b|\\b') + "\\b"].join('|'), 'g');
	var NUMBER_RE = /^\d[^,]*|,\d[^,]*/g;
	var BOUNDARY_RE = /^,+|,+$/g;
	var SPLIT2_RE = /^$|,+/;

	// 获取变量
	function getVariable(code)
	{
		return code.replace(REMOVE_RE, '').replace(SPLIT_RE, ',').replace(KEYWORDS_RE, '').replace(NUMBER_RE, '').replace(BOUNDARY_RE, '').split(SPLIT2_RE);
	};

	// 字符串转义
	function stringify(code)
	{
		return "'" + code
		// 单引号与反斜杠转义
		.replace(/('|\\)/g, '\\$1')
		// 换行符转义(windows + linux)
		.replace(/\r/g, '\\r').replace(/\n/g, '\\n') + "'";
	}

	function compiler(source, options)
	{

		var debug = options.debug;
		var openTag = options.openTag;
		var closeTag = options.closeTag;
		var parser = options.parser;
		var compress = options.compress;
		var escape = options.escape;

		var line = 1;
		var uniq =
		{
			$data : 1,
			$filename : 1,
			$utils : 1,
			$helpers : 1,
			$out : 1,
			$line : 1
		};

		var isNewEngine = ''.trim;
		// '__proto__' in {}
		var replaces = isNewEngine ? ["$out='';", "$out+=", ";", "$out"] : ["$out=[];", "$out.push(", ");", "$out.join('')"];

		var concat = isNewEngine ? "$out+=text;return $out;" : "$out.push(text);";

		var print = "function(){" + "var text=''.concat.apply('',arguments);" + concat + "}";

		var include = "function(filename,data){" + "data=data||$data;" + "var text=$utils.$include(filename,data,$filename);" + concat + "}";

		var headerCode = "'use strict';" + "var $utils=this,$helpers=$utils.$helpers," + ( debug ? "$line=0," : "");

		var mainCode = replaces[0];

		var footerCode = "return new String(" + replaces[3] + ");"

		// html与逻辑语法分离
		forEach(source.split(openTag), function(code)
		{
			code = code.split(closeTag);

			var $0 = code[0];
			var $1 = code[1];

			// code: [html]
			if (code.length === 1)
			{

				mainCode += html($0);

				// code: [logic, html]
			} else
			{

				mainCode += logic($0);

				if ($1)
				{
					mainCode += html($1);
				}
			}

		});

		var code = headerCode + mainCode + footerCode;

		// 调试语句
		if (debug)
		{
			code = "try{" + code + "}catch(e){" + "throw {" + "filename:$filename," + "name:'Render Error'," + "message:e.message," + "line:$line," + "source:" + stringify(source) + ".split(/\\n/)[$line-1].replace(/^\\s+/,'')" + "};" + "}";
		}

		try
		{

			var Render = new Function("$data", "$filename", code);
			Render.prototype = utils;

			return Render;

		} catch (e)
		{
			e.temp = "function anonymous($data,$filename) {" + code + "}";
			throw e;
		}

		// 处理 HTML 语句
		function html(code)
		{

			// 记录行号
			line += code.split(/\n/).length - 1;

			// 压缩多余空白与注释
			if (compress)
			{
				code = code.replace(/\s+/g, ' ').replace(/<!--[\w\W]*?-->/g, '');
			}

			if (code)
			{
				code = replaces[1] + stringify(code) + replaces[2] + "\n";
			}

			return code;
		}

		// 处理逻辑语句
		function logic(code)
		{

			var thisLine = line;

			if (parser)
			{

				// 语法转换插件钩子
				code = parser(code, options);

			} else if (debug)
			{

				// 记录行号
				code = code.replace(/\n/g, function()
				{
					line++;
					return "$line=" + line + ";";
				});

			}

			// 输出语句. 编码: <%=value%> 不编码:<%=#value%>
			// <%=#value%> 等同 v2.0.3 之前的 <%==value%>
			if (code.indexOf('=') === 0)
			{

				var escapeSyntax = escape && !/^=[=#]/.test(code);

				code = code.replace(/^=[=#]?|[\s;]*$/g, '');

				// 对内容编码
				if (escapeSyntax)
				{

					var name = code.replace(/\s*\([^\)]+\)/, '');

					// 排除 utils.* | include | print

					if (!utils[name] && !/^(include|print)$/.test(name))
					{
						code = "$escape(" + code + ")";
					}

					// 不编码
				} else
				{
					code = "$string(" + code + ")";
				}

				code = replaces[1] + code + replaces[2];

			}

			if (debug)
			{
				code = "$line=" + thisLine + ";" + code;
			}

			// 提取模板中的变量名
			forEach(getVariable(code), function(name)
			{

				// name 值可能为空，在安卓低版本浏览器下
				if (!name || uniq[name])
				{
					return;
				}

				var value;

				// 声明模板变量
				// 赋值优先级:
				// [include, print] > utils > helpers > data
				if (name === 'print')
				{

					value = print;

				} else if (name === 'include')
				{

					value = include;

				} else if (utils[name])
				{

					value = "$utils." + name;

				} else if (helpers[name])
				{

					value = "$helpers." + name;

				} else
				{

					value = "$data." + name;
				}

				headerCode += name + "=" + value + ",";
				uniq[name] = true;

			});

			return code + "\n";
		}

	};

	// RequireJS && SeaJS
	if ( typeof define === 'function')
	{
		define(function()
		{
			return template;
		});

		// NodeJS
	} else if ( typeof exports !== 'undefined')
	{
		module.exports = template;
	} else
	{
		this.template = template;
	}

})();

//---------------------js基础函数
/** 弹出提示框
 * @str   	String	提示消息
 */
template.helper('alert', function(str)
{
	alert(str);
});
//---------------------apicloud前端框架开发指南-函数
/** 去掉字符串首尾空格
 * @str   	String	文本
 * @return	String	去除首尾空格的字符串
 */
template.helper('trim', function(str)
{
	return $api.trim(str);
});
/** 去掉字符串所有空格
 * @str   	String	文本
 * @return	String	去除所有空格的字符串
 */
template.helper('trimAll', function(str)
{
	return $api.trimAll(str);
});
/** 判断对象是否为数组
 * @obj   	Object	对象
 * @return	Boolean
 */
template.helper('isArray', function(obj)
{
	return $api.isArray(obj);
});
/** 为DOM元素绑定事件
 * @el    		Element		DOM元素
 * @name   		String		事件类型
 * @fn   		Function	事件回调
 * @useCapture	Boolean		事件捕获
 * @return	无
 */
template.helper('addEvt', function(el, name, fn, useCapture)
{
	return $api.addEvt(el, name, fn, useCapture);
});
/** 移除DOM元素绑定事件
 * @el    		Element		DOM元素
 * @name   		String		事件类型
 * @fn   		Function	事件回调
 * @useCapture	Boolean		事件捕获
 * @return	无
 */
template.helper('rmEvt', function(el, name, fn, useCapture)
{
	return $api.rmEvt(el, name, fn, useCapture);
});
/** 为DOM元素绑定事件，事件只执行一次
 * @el    		Element		DOM元素
 * @name   		String		事件类型
 * @fn   		Function	事件回调
 * @useCapture	Boolean		事件捕获
 * @return	无
 */
template.helper('one', function(el, name, fn, useCapture)
{
	return $api.one(el, name, fn, useCapture);
});
/** 选择首个匹配的DOM元素
 * @el   	Element		DOM元素
 * @selector   	Selector	CSS 选择器
 * @return	返回首个匹配的DOM元素
 */
template.helper('dom', function(el, selector)
{
	return $api.dom(el, selector);
});
/** 选择所有匹配的DOM元素
 * @el   		Element		DOM元素
 * @selector   	Selector	CSS 选择器
 * @return	返回所有匹配的DOM元素
 */
template.helper('domAll', function(el, selector)
{
	return $api.domAll(el, selector);
});
/** 通过Id选择DOM元素
 * @id   	String	CSS id 字符串
 * @return	返回匹配的DOM元素
 */
template.helper('byId', function(id)
{
	return $api.byId(id);
});
/** 选择DOM元素的第一个子元素
 * @el   		Element		DOM元素
 * @selector   	Selector	CSS 选择器
 * @return		 返回DOM元素的第一个子元素
 */
template.helper('first', function(el, selector)
{
	return $api.first(el, selector);
});
/** 选择DOM元素的最后一个子元素
 * @el   		Element		DOM元素
 * @selector   	Selector	CSS 选择器
 * @return		  返回DOM元素的最后一个子元素
 */
template.helper('last', function(el, selector)
{
	return $api.last(el, selector);
});
/** 选择第几个子元素
 * @el   		Element			DOM元素
 * @index   	String|Number	索引值
 * @return		根据索引值返回子元素
 */
template.helper('eq', function(el, index)
{
	return $api.eq(el, index);
});
/** 根据排除选择器选择子元素
 * @el   		Element		DOM元素
 * @selector   	Selector	CSS 选择器
 * @return		返回不匹配选择器的所有子元素
 */
template.helper('not', function(el, selector)
{
	return $api.not(el, selector);
});
/** 选择相邻的前一个元素
 * @el   	Element		DOM元素
 * @return	返回前一个元素
 */
template.helper('prev', function(el)
{
	return $api.prev(el);
});
/** 选择相邻的下一个元素
 * @el   	Element		DOM元素
 * @return	返回下一个元素
 */
template.helper('next', function(el)
{
	return $api.next(el);
});
/** 判断某一个元素是否包含目标元素
 * @parentEl   	Element	DOM元素
 * @targetEl   	Element	DOM元素
 * @return		true 或 false
 */
template.helper('contains', function(parentEl, targetEl)
{
	return $api.contains(parentEl, targetEl);
});
/** 根据选择器匹配最近的父元素
 * @el   		Element		DOM元素
 * @selector   	Selector	CSS 选择器
 * @return		根据选择器匹配最近的父元素
 */
template.helper('closest', function(el, selector)
{
	return $api.closest(el, selector);
});
/** 移除DOM元素
 * @el   	Element		DOM元素
 * @return
 */
template.helper('remove', function(el)
{
	return $api.remove(el);
});
/** 获取或设置DOM元素的属性
 * @el   	Element	DOM元素
 * @name   	String	属性名
 * @value   String	属性值
 * @return	返回当前DOM元素
 */
template.helper('attr', function(el, name, value)
{
	return $api.attr(el, name, value);
});
/** 移除DOM元素的属性
 * @el   	Element	DOM元素
 * @name   	String	属性名
 * @return
 */
template.helper('removeAttr', function(el, name)
{
	return $api.removeAttr(el, name);
});
/** DOM元素是否含有某个className
 * @el   	Element	DOM元素
 * @cls   	String	className
 * @return	Boolean
 */
template.helper('hasCls', function(el, cls)
{
	return $api.hasCls(el, cls);
});
/** 为DOM元素增加className
 * @el   	Element	DOM元素
 * @cls   	String	className
 * @return	返回当前DOM元素
 */
template.helper('addCls', function(el, cls)
{
	return $api.addCls(el, cls);
});
/** 移除指定的className
 * @el   	Element	DOM元素
 * @cls   	String	className
 * @return	返回当前DOM元素
 */
template.helper('removeCls', function(el, cls)
{
	return $api.removeCls(el, cls);
});
/** 切换指定的className
 * @el   	Element	DOM元素
 * @cls   	String	className
 * @return
 */
template.helper('toggleCls', function(el, cls)
{
	return $api.toggleCls(el, cls);
});
/** 获取或设置常用 Form 表单元素的 value 值
 * @el   	Element	DOM元素
 * @val   	String	想设置的value值
 * @return	返回当前DOM元素
 */
template.helper('val', function(el, val)
{
	return $api.val(el, val);
});
/** 在DOM元素内部，首个子元素前插入HTML字符串
 * @el   	Element		DOM元素
 * @html   	htmlString	HTML字符串
 * @return	返回当前DOM元素
 */
template.helper('prepend', function(el, html)
{
	return $api.prepend(el, html);
});
/** 在DOM元素内部，最后一个子元素后面插入HTML字符串
 * @el   	Element		DOM元素
 * @html   	htmlString	HTML字符串
 * @return	返回当前DOM元素
 */
template.helper('append', function(el, html)
{
	return $api.append(el, html);
});
/** 在DOM元素前面插入HTML字符串
 * @el   	Element		DOM元素
 * @html   	htmlString	HTML字符串
 * @return	返回当前DOM元素
 */
template.helper('before', function(el, html)
{
	return $api.before(el, html);
});
/** 在DOM元素后面插入HTML字符串
 * @el   	Element		DOM元素
 * @html   	htmlString	HTML字符串
 * @return	返回当前DOM元素
 */
template.helper('after', function(el, html)
{
	return $api.after(el, html);
});
/** 获取或设置DOM元素的innerHTML
 * @el   	Element		DOM元素
 * @html   	htmlString	HTML字符串
 * @return	返回当前DOM元素
 */
template.helper('html', function(el, html)
{
	return $api.html(el, html);
});
/** 设置或者获取元素的文本内容
 * @el   	Element		DOM元素
 * @html   	htmlString	HTML字符串
 * @return	当前DOM元素
 */
template.helper('text', function(el, txt)
{
	return $api.text(el, txt);
});
/** 获取元素在页面中的位置与宽高，(此为距离页面左侧及顶端的位置，并非距离窗口的位置)
 * @el   	Element		DOM元素
 * @return	该元素的位置（left,top）及宽高（width,height）,返回值是json类型的，包括l,t,w,h属性
 */
template.helper('offset', function(el)
{
	return $api.offset(el);
});
/** 设置所传入的DOM元素的样式，可传入多条样式
 * @el   	Element		DOM元素
 * @css   	String		想要设置的CSS样式
 * @return
 */
template.helper('css', function(el, css)
{
	return $api.css(el, css);
});
/** 获取指定DOM元素的指定属性的完整的值，如800px
 * @el   	Element		DOM元素
 * @prop   	String		CSS属性
 * @return	完整的CSS属性值
 */
template.helper('cssVal', function(el, prop)
{
	return $api.cssVal(el, prop);
});
/** 将标准的JSON 对象转换成字符串格式
 * @json   	JSON		JSON对象
 * @return	转换后的字符串
 */
template.helper('jsonToStr', function(json)
{
	return $api.jsonToStr(json);
});
/** 将JSON字符串转换成JSON对象
 * @str   	String	JSON字符串
 * @return	JSON对象
 */
template.helper('strToJson', function(str)
{
	return $api.strToJson(str);
});
/** 设置localStorage数据
 * @key   	String	键名
 * @value   String	值
 * @return
 */
template.helper('setStorage', function(key, value)
{
	return $api.setStorage(key, value);
});
/** 获取localStorage数据，必须与$api.setStorage()配套使用
 * @key   	String	键名
 * @return	localStorage中与键名对应的值
 */
template.helper('getStorage', function(key)
{
	return $api.getStorage(key);
});
/** 清除localStorage中与键名对应的值
 * @key   	String	键名
 * @return
 */
template.helper('rmStorage', function(key)
{
	return $api.rmStorage(key);
});
/** 清除localStorage的所有数据，慎用
 * @return
 */
template.helper('clearStorage', function()
{
	return $api.clearStorage();
});
/** 适配iOS7+系统状态栏，为传入的DOM元素增加20px的上内边距
 * @el   	Element	DOM元素
 * @return
 */
template.helper('fixIos7Bar', function(el)
{
	return $api.fixIos7Bar(el);
});
/** 适配iOS7+、Android4.4+系统状态栏，为传入的DOM元素增加适当的上内边距，避免header与状态栏重叠
 * @el   	Element	DOM元素
 * @return
 */
template.helper('fixStatusBar', function(el)
{
	return $api.fixStatusBar(el);
});
/** 延时提示框
 * @title   String	标题(可选参数)
 * @text   	String	内容(可选参数)
 * @time   	Number	延时的时间(可选参数),单位为毫秒，默认值为500
 * @return
 */
template.helper('toast', function(title, text, time)
{
	return $api.toast(title, text, time);
});
/** api.ajax()方法的get方式简写
 * @url   		String	 	url(必传参数)
 * @fnSuc   	Function	成功回调函数(可选参数)
 * @dataType   	String		返回值的类型(可选参数)，有text与json两种类型，默认为json
 * @return		根据dataType在成功回调函数里返回相应数据
 */
template.helper('get', function(url, fnSuc, dataType)
{
	return $api.get(url, fnSuc, dataType);
});
/** api.ajax()方法的post方式简写
 * @url   		String		url(必传参数)
 * @data   		JSON		请求体（字符串类型）values：post参数（JSON对象）
 * @files   	JSON		post文件（JSON对象）等参数(可选参数)
 * @fnSuc    	Function	成功回调函数(可选参数)
 * @dataType   	String		有text与json两种类型，默认为json
 * @return		向url地址发送ajax请求，并发送数据data，根据dataType在成功回调函数返回相应数据
 */
template.helper('post', function(url, data, fnSuc, dataType)
{
	return $api.post(url, data, fnSuc, dataType);
});
/** 
 * @url   		json转string
 * @data   		JSON		JSON对象
 * @return		string
 */
template.helper('json', function(json)
{
	return $api.jsonToStr(json);
});
/**
 * @brief		dateDiff 算时间差
 * @param[in]	long 	hisTime 历史时间戳，必传
 * @param[in]	long 	nowTime 当前时间戳，不传将获取当前时间戳
 * @return		string 
 */
template.helper('dateDiff', function(hisTime_str, nowTime_str)
{
	return foryou.dateDiff(new Date(hisTime_str).getTime(), new Date(nowTime_str).getTime());
});
