/**
 * Background Script - Wend Solver v3
 * Handles:
 * 1. Side panel opener
 * 2. Tab capture
 * 3. Free word search (solvePuzzle)
 * 4. Constrained Wend solver (solveWend) — covers ALL cells with exact words
 */

// ── SIDE PANEL ──────────────────────────────────────────────
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

// ── DICTIONARY ──────────────────────────────────────────────
// Clean, comprehensive word list (3–10 letters)
const WORDS = [
  // 3-letter
  'ace','act','add','age','ago','aid','aim','air','all','and','ant','any','ape','arc','are','ark','arm','art','ash','ask','ate','awe','axe','aye',
  'bad','bag','ban','bar','bat','bay','bed','bee','bet','bid','big','bin','bit','boa','bog','bow','box','boy','bud','bug','bus','but','buy','bye',
  'cab','can','cap','car','cat','cod','cop','cow','coy','cry','cub','cup','cut',
  'dad','day','den','dew','did','die','dig','dim','dip','dog','dot','dry','dub','due','dug',
  'ear','eat','eel','egg','ego','elf','elm','end','era','err','eve','eye',
  'fan','far','fat','fed','fee','few','fib','fig','fin','fir','fit','fix','fly','foe','fog','for','fox','fry','fun','fur',
  'gag','gap','gas','gay','gel','gem','get','gig','gin','god','got','gum','gun','gut','guy','gym',
  'had','hag','ham','has','hat','hay','hem','hen','her','hid','him','hip','his','hit','hog','hop','hot','how','hub','hue','hug','hum','hut',
  'ice','icy','ill','ink','inn','ion','its','ivy',
  'jab','jam','jar','jaw','jay','jet','job','jog','joy','jug',
  'keg','ken','key','kid','kin','kit',
  'lab','lad','lag','lap','law','lay','led','leg','let','lid','lie','lip','lit','log','lot','low',
  'mad','man','map','mat','may','men','met','mid','mix','mob','mop','mud','mug',
  'nap','net','new','nod','nor','not','now','nut',
  'oak','oar','oat','odd','off','oil','old','one','opt','our','out','owe','owl','own',
  'pad','pal','pan','pat','paw','pay','pea','peg','pen','per','pet','pig','pin','pit','pot','pry','pub','pun','pup','put',
  'rag','ram','ran','rap','rat','raw','ray','red','ref','rep','rib','rid','rig','rim','rip','rob','rod','rot','row','rub','rug','run','rut','rye',
  'sad','sag','sat','saw','say','sea','see','set','sew','shy','sin','sip','sir','sis','sit','six','ski','sky','sly','sob','sod','son','spa','spy','sub','sum','sun',
  'tab','tag','tan','tap','tar','tax','tea','ten','the','tic','tie','tin','tip','toe','ton','too','top','toy','try','tub','tug','two',
  'urn','use',
  'van','vat','vet','via','vie',
  'wad','wag','war','was','wax','way','web','wed','wee','wet','who','why','wig','win','wit','woe','won','woo',
  'yes','yet','you',
  'zap','zip','zoo',

  // 4-letter
  'able','acid','aged','aide','also','arch','area','arts','atom',
  'back','bake','ball','band','bank','bare','bark','base','bath','beam','bean','bear','beat','been','bell','belt','bend','best','bike','bird','bite','blow','blue','boat','body','boil','bold','bolt','bone','book','boom','boot','born','bowl','brew','buck','bulb','bulk','burn','bury','bush','busy',
  'cafe','cage','cake','call','came','camp','card','care','case','cast','cell','chat','chin','chop','city','clap','clay','clip','club','coal','coat','code','coin','cold','come','cook','cool','cope','copy','cord','core','corn','cost','crab','crew','crop','cube','curb','cure','curl','cute',
  'damp','dare','dark','date','dawn','dead','deaf','deal','dean','dear','deck','deed','deep','deer','demo','deny','desk','dial','dice','diet','dime','dine','dire','dirt','disc','dish','dive','dock','does','done','door','dose','dove','down','drag','dram','draw','drew','drip','drop','drug','drum','dual','dude','duke','dull','dump','dune','dunk','dusk','dust',
  'each','earl','earn','ease','east','easy','echo','edge','edit','else','emit','epic','euro','even','ever','evil','exam','exit',
  'face','fact','fade','fail','fair','fake','fall','fame','fare','farm','fast','fate','fear','feat','feed','feel','feet','fell','felt','fern','file','fill','film','find','fine','fire','firm','fish','five','flag','flat','fled','flee','flew','flip','flow','foam','fold','folk','fond','font','food','fool','foot','fork','form','fort','foul','four','free','from','fuel','full','fund','fuse',
  'gain','game','gang','gate','gave','gear','gene','gift','girl','give','glad','glue','goal','goat','goes','gold','golf','gone','good','grab','gram','gray','grew','grey','grid','grin','grip','grow','gulf','gust',
  'hack','hair','half','hall','hand','hang','hard','hare','harm','hate','have','hawk','head','heal','heap','hear','heat','heed','heel','held','hell','help','herb','herd','here','hero','hide','high','hike','hill','hint','hire','hole','holy','home','hood','hook','hope','horn','host','hour','huge','hung','hunt','hurt',
  'idea','idle','inch','info','iron',
  'jack','jail','junk','jury',
  'keen','keep','kept','kick','kill','kind','king','kiss','knee','knew','knot','know',
  'lack','lady','laid','lake','lamb','lame','land','lane','last','late','lead','leaf','leak','lean','leap','left','lend','lens','less','liar','life','lift','like','line','link','lion','list','live','load','loaf','loan','lock','loft','lone','long','look','loop','lord','lose','loss','lost','loud','love','luck','lump','lung','lure','lust',
  'maid','mail','main','make','male','mall','many','mark','mask','mass','math','meal','mean','meat','meet','melt','memo','menu','mess','mice','mild','mile','milk','mill','mind','mine','mint','miss','mist','mode','mood','moon','more','moss','moth','move','much','mule','must',
  'nail','name','navy','near','neat','neck','need','nest','news','next','nice','nick','noun','nose','note',
  'oath','obey','odds','oven','over',
  'pace','pack','page','paid','pail','pain','pair','pale','palm','park','part','pass','path','pave','peak','peel','peer','pest','pick','pile','pill','pine','pink','pint','pipe','plan','play','plea','plot','plug','poem','poet','pole','poll','pond','pony','pool','poor','pope','pork','port','pose','post','pour','pray','prep','prey','pull','pulp','pump','pure','push',
  'quit','quiz',
  'race','rack','rage','raid','rail','rain','rake','rank','rare','rate','read','real','reap','rear','rely','rent','rest','rice','rich','ride','ring','riot','ripe','rise','risk','road','roam','roar','robe','rock','rode','role','roll','roof','room','root','rope','rose','rude','ruin','rule','rung','rush','rust',
  'safe','sage','said','sail','sake','sale','salt','same','sand','sane','sang','sank','save','seal','seam','seat','seed','seek','seem','seen','self','sell','send','sent','shed','ship','shoe','shop','shot','show','shut','sick','side','sigh','sign','silk','sing','sink','site','size','skip','slab','slam','slap','sled','slip','slow','slug','snap','snow','soap','soar','sock','soda','soft','soil','sold','sole','some','song','soon','sore','sort','soul','soup','span','spin','spot','stab','stag','star','stay','stem','step','stew','stir','stop','such','suit','sure','swap','swim',
  'tail','take','tale','talk','tall','tank','tape','task','team','tear','teen','tell','tend','tent','term','test','text','than','that','thee','them','then','they','thin','this','tick','tide','tidy','tied','tier','tile','till','tilt','time','tiny','tire','toad','toes','told','toll','tone','took','tool','tore','torn','toss','tour','town','trap','tray','tree','trek','trim','trio','trip','trot','true','tube','tune','twin','type',
  'ugly','unit','upon','used','user',
  'vain','vale','vary','vase','vast','verb','very','vice','view','vine','visa','void','vote',
  'wade','wage','wait','wake','walk','wall','want','ward','warm','warn','wash','wasp','wave','weak','wear','week','weep','well','went','were','west','what','when','whom','wide','wife','wild','will','wind','wine','wing','wink','wise','wish','with','wolf','womb','wood','wool','word','wore','work','worm','worn','wrap','wren',
  'yard','yarn','year','yell','yoga','yoke','your',
  'zone',

  // 5-letter
  'about','above','abuse','acute','admit','adopt','adult','after','again','agent','agree','ahead','alarm','album','alert','alien','align','alike','allow','alone','along','alter','angel','anger','angle','ankle','apart','apple','apply','arena','argue','arise','armed','armor','array','arrow','aside','asset','avoid','awake','award','aware',
  'baker','basis','beast','began','begin','being','below','bench','birth','black','blade','blame','blank','blast','bleed','bless','blind','block','blood','blown','board','boost','booth','bound','brain','brand','brass','brave','bread','break','breed','brick','bride','brief','bring','broad','broke','brown','build','built','burst',
  'cable','cargo','carry','carve','catch','cause','chain','chair','chalk','charm','chart','chase','cheap','cheat','check','cheek','cheer','chest','chief','child','choir','chose','civic','claim','clash','class','clean','clear','click','cliff','climb','clock','clone','close','cloth','cloud','clown','coach','coast','colon','color','comic','couch','cough','could','count','court','cover','crack','craft','crash','crazy','cream','creed','creek','crime','crisp','crook','cross','crowd','crown','crude','crush','curve','cycle',
  'daily','dance','dealt','death','debut','delay','dense','depth','derby','deter','diary','dirty','disco','diver','dodge','doing','doubt','dough','dozen','draft','drama','drawn','dream','dress','dried','drift','drink','drive','drown','dunce',
  'eager','early','earth','eight','elbow','elder','elite','empty','enemy','enjoy','enter','entry','equal','error','essay','event','every','exact','exile','exist','extra',
  'faint','fairy','faith','false','fancy','fatal','fault','favor','feast','fence','ferry','fetch','fever','field','fiery','fifth','fifty','fight','final','first','fixed','flame','flash','fleet','flesh','flood','floor','flour','fluid','flush','focus','force','forge','frame','fraud','freak','fresh','front','frost','fruit','fully','funny',
  'games','genre','ghost','giant','given','gland','glass','gleam','glide','globe','gloom','glory','glove','grace','grade','grain','grant','grape','grass','grate','grave','great','greed','green','greet','grief','grill','groan','groom','gross','group','grove','grown','guard','guess','guest','guide','guild','guilt',
  'habit','hairy','handy','happy','hardy','harsh','haste','hasty','hatch','haunt','havoc','haven','heads','heard','heart','heavy','hedge','heels','hefty','hello','hence','herbs','heron','hobby','holds','holly','homes','hooks','horse','house','hover','human','humid','humor','hurry',
  'icons','ideal','idiom','issue',
  'jeans','joint','jolly','judge','juice','jumbo',
  'karma','keeps','kicks','kills','kinds','kings','knack','knead','knife','knock','knots','known',
  'label','labor','lance','lands','lanes','large','laugh','layer','leads','leafy','lease','leash','least','leave','legal','level','light','liked','limit','lined','linen','liner','lives','loads','local','lodge','lofty','logic','loins','loose','lower','lowly','loyal','lucky','lucid','lunch','lunge',
  'magic','major','maker','manor','march','match','mayor','media','mercy','merit','metal','might','minor','model','money','month','moral','motor','motto','mount','mouse','mouth','music',
  'naive','nerve','never','night','noble','noise','north','noted','novel','nurse',
  'occur','ocean','offer','often','olive','onset','order','organ','other','ought','outer','owner',
  'paint','panel','paper','party','pause','peace','pearl','penal','penny','phase','phone','photo','piano','piece','pilot','pitch','pixel','pizza','place','plain','plane','plant','plate','plaza','plead','pluck','plume','poise','polar','porch','pound','power','press','price','pride','prime','print','prism','prize','probe','prone','proof','prose','proud','prove','prowl','psalm','pulse','purer','purse','puzzle',
  'queen','quest','queue','quiet','quite',
  'radar','radio','raise','rally','range','rapid','ratio','reach','ready','realm','rebel','refer','reign','relax','repay','repel','rider','ridge','rifle','rigid','risky','rival','river','robin','rocky','rouge','rough','round','route','royal','rugby','ruler',
  'sadly','saint','salad','scale','scare','scene','scent','scope','score','scout','seize','sense','serve','setup','seven','shade','shake','shall','shame','shape','share','shark','sharp','shear','sheet','shelf','shell','shift','shock','shoot','shore','short','shout','shovel','since','sixth','sixty','skill','slate','slave','sleep','sleet','slice','slide','slope','smart','smell','smile','smoke','solid','solve','sorry','south','space','spare','spark','spawn','speed','spell','spend','spike','spine','spirit','split','spoke','spore','sport','spray','squad','squat','stack','staff','stage','stain','stake','stale','stand','stark','start','state','stave','steam','steel','steep','steer','stern','stick','stiff','still','stock','stole','stone','stood','store','storm','story','stout','stove','straw','stray','strip','strum','stuck','study','stuff','style','sugar','suite','sulky','sunny','super','surge','swamp','swear','sweat','sweep','sweet','swift','swirl','sword',
  'table','taken','taste','taxes','teach','teeth','tense','terms','thank','theme','there','these','thick','thing','think','those','three','threw','throw','thumb','tidal','tiger','tight','timer','tired','title','today','token','touch','tough','towel','tower','toxic','trace','track','trade','trail','train','trait','tramp','trash','treat','trend','trial','tribe','trick','tried','troop','truck','truly','trust','truth','tumor','tweak','twice','twist',
  'ulcer','under','unfair','union','until','upper','upset','urban','usher',
  'valid','valor','value','valve','video','vigor','viral','virus','visit','vital','vivid','vocal','vodka',
  'wagon','waste','watch','water','weary','weave','wedge','weigh','weird','whale','wheat','wheel','where','which','while','white','whole','whose','wield','wince','witch','witty','woman','women','wrath','write','wrote','young',

  // 6-letter
  'abrupt','absent','absorb','accent','accept','access','acquit','action','active','actual','adjust','admire','advise','affect','afford','afraid','agency','agenda','agreed','almost','always','ambush','amount','annual','answer','anvil','appear','around','artist','aspire','assure','attain','attend','attune',
  'banter','battle','beauty','beckon','before','behalf','behave','behind','belief','belong','beside','beware','bitter','bounce','breach','breeze','bridge','bright','broken','brutal','bubble','burden','bustle',
  'candid','cannot','castle','casual','caught','cavern','center','charge','chosen','circle','circus','clever','combat','common','comply','confer','confuse','corner','course','cousin','create','credit','crisis','critic','custom',
  'damage','danger','dangle','dazzle','decent','decide','defend','delight','demand','dental','desert','design','desire','detail','devote','differ','direct','domain','double','driven','during',
  'easily','effect','either','emerge','empire','enable','endure','engage','ensure','entire','escape','except','expect','expose','extend','extent',
  'fallen','famous','fasten','father','fierce','figure','finger','finish','fiscal','fonder','forest','formal','foster','frozen','future',
  'gentle','global','govern','growth','guided',
  'happen','health','hearty','height','heroic','hidden','highly','honest','honest','horror','humble',
  'ignite','impact','impose','income','indeed','infant','inform','injury','insect','insure','intend','invest','invite','island',
  'joyful','junior','justice',
  'keeper','killer',
  'leader','lessen','letter','little','lively','lonely','looked','losing','lovely','luxury',
  'madden','manage','margin','market','master','matter','meadow','medium','mental','method','middle','mighty','modest','moment','mostly','mother','motion','motive','muscle','mutual','mystic',
  'narrow','nation','nature','nearby','normal','notice','nourish',
  'object','obtain','office','opened','oppose','option','orange','origin','output',
  'parish','pardon','parrot','patent','patrol','patron','patter','penult','people','period','permit','person','pigeon','pillar','planet','please','pledge','plenty','plural','pocket','polish','public','purple','pursue',
  'quietly',
  'racket','random','rarely','rather','reason','recent','reduce','relief','remain','remote','repair','repeat','rescue','result','return','reveal','review','reward','riddle','rising','robust','rotate','rotten','rubber',
  'sadden','safety','sample','search','season','second','secret','seldom','select','senior','settle','silent','silver','simple','single','sister','sleepy','slight','smooth','soften','solved','source','spirit','spoken','spread','spring','square','stable','string','strong','struck','stupid','sudden','suffer','summer','supply','surely','survey','switch','symbol',
  'talent','target','tasted','tender','tested','theory','tightly','timely','tissue','tongue','toward','travel','tunnel','typist',
  'unfold','unique','unlock','update','uphold','urgent',
  'various','vendor','victim','virtue','visual','volume',
  'wander','warden','warmth','wealth','weight','wholly','widget','wisdom','wither','wonder','worthy',
  'yearly',
  'zealot',

  // 7-letter
  'abandon','ability','absence','absolve','achieve','acquire','acutely','address','advance','adverse','affable','against','applies','appoint','arrange','attempt','attract',
  'balance','because','becomes','between','blunder','briefly','brought',
  'cabinet','capture','careful','ceiling','century','certain','channel','chapter','charity','chimney','citizen','classic','climate','cluster','collect','command','complex','concern','context','control','convert','convict','counsel','counter','country','coupled','crucial','culture',
  'dealing','decided','defense','destiny','develop','devoted','digital','dioxide','display','distant','diverse','drawing','dynamic',
  'economy','example','exclaim','excited','explore','extreme',
  'feature','feeling','fiction','freedom','foreign','forward','funding',
  'genuine','glitter','glimpse','goddess','gradual','grammar','gravity','greatly',
  'harmony','healthy','hearing','herself','highest','himself','history','holding','hundred',
  'imagine','impugn','improve','include','incline','instant','instead','involve',
  'journey','justice',
  'keeping','knowing','kingdom',
  'largely','leading','learned','liberty','lengthy','logical',
  'marshal','meeting','mention','miracle','missing','mission','mixture','monster','morning','mystery',
  'nothing','nowhere',
  'officer','operate','opinion','outcome','outside','overall',
  'package','partner','pattern','percent','perfect','perform','perhaps','picture','playing','popular','portion','poverty','present','prevent','primary','private','problem','process','product','program','project','promise','provide','purpose',
  'quality','quarter','quickly','quietly',
  'rapidly','reading','reality','recover','replace','require','reserve','resolve','respect','respond','results','returns','reunion','robbery',
  'satisfy','scandal','section','serious','service','setting','similar','society','somehow','someone','shortly','silence','silicon','special','station','strange','stretch','subject','suburbs','succeed','surface','sustain','symptom','systems',
  'teacher','testing','through','tonight','totally','tourist','tragedy','trouble','turning',
  'usually',
  'variety','vehicle','venture','version','village','violent',
  'welcome','western','whereas','without','worried','worship',

  // 8-letter
  'absolute','abstract','abundant','accepted','accident','accurate','achieved','activity','actually','addition','adequate','adjusted','admitted','adoption','advanced','affected','affirmed','aggravate','aircraft','alliance','allowed','alphabet','although','ambition','analysis','animated','announce','approval','argument','assembly','assigned','auditory',
  'balanced','behavior','benefits','boundary','business',
  'calendar','campaign','capacity','captured','casualty','champion','character','children','choosing','climbing','combined','commerce','communal','complete','composed','computer','concrete','concerns','conflict','consider','consumer','contains','continue','contrary','controls','criminal','critical','cultural','customer',
  'database','decision','declared','decrease','defining','delivery','designed','detailed','develops','dialogue','diplomat','directly','disaster','discover','distinct','document','domestic','dominant','dramatic','duration',
  'economic','educated','educator','election','embrace','emphasis','employed','employer','enriched','ensuring','entirely','entrance','equality','evaluate','evidence','examined','examples','exceeded','excellent','exciting','exclusive','exercise','existing','expected','exposure',
  'familiar','feedback','fighting','financial','flexible','followed','forecast','formerly','fraction','frequent','function','generate','gracious','grateful','guidance',
  'handling','helpless','heritage','hesitate','homeland','honestly','hospital','humanity','hundreds',
  'identity','imagined','improved','includes','increase','indicate','industry','informed','inherent','innocent','inspired','integral','intended','interval','involved',
  'jealousy','judgment',
  'language','launching','learning','likewise','location','lonesome','longing',
  'maintain','majority','marriage','material','measured','mediocre','memories','military','minimize','minority','moderate','monetary','moreover','movement','multiple','multiply',
  'national','negative','normally','numerous',
  'observed','obstacle','ordinary','organize','original','overcome',
  'parallel','patience','peaceful','personal','physical','position','positive','possible','powerful','practice','precious','prepared','presence','pressure','previous','priority','probable','progress','promotes','proposed','protected','provided','pursuing',
  'question','randomly','rational','reaching','realized','received','recently','recovery','referral','regarded','rejected','relevant','remained','replaced','required','research','resolved','returned','rhetoric',
  'scenario','schedule','security','selected','sensation','separate','services','settling','shortage','slightly','solution','somewhat','specific','spending','standard','struggle','students','studying','supports','survival','symptoms',
  'talented','taxation','tendency','terminal','thinking','thousand','together','tomorrow','training','transfer','traveled','treasury','tribunal','tropical','truthful',
  'unbiased','upcoming','upstream',
  'valuable','variable','visiting','volatile',
  'warranty','weakness','whatever','whenever','wherever','withdraw','wonders',

  // 9-letter
  'abandoned','abolition','abundance','acceptable','acclaimed','accounted','accuracy','achievable','adventure','agreement','alongside','amazement','ambiguous','ambitious','anonymous','apprehend','attempted',
  'carefully','celebrate','challenge','character','classical','colleague','committed','community','competent','complaint','completed','condition','confident','connected','conscious','considers','construct','continues','corporate','countless','curiosity',
  'dedicated','defensive','delivered','democracy','desperate','different','difficult','direction','diversity','dominated',
  'elaborate','emergency','emotional','encourage','enjoyment','establish','evaluated','exception','exchanged','exclusive','execution','exemplary','existence','expressed','extension','extremely',
  'fantastic','favorable','formation','frequency','frustrate','fulfilled',
  'generally','glamorous','gradually','guarantee',
  'happening','historical','household','hurricane',
  'imagining','important','inability','inclusion','increased','indicated','influence','inspiring','integrity','intention','introduced',
  'knowledge',
  'landscape','legendary','listening','literally',
  'memorable','mentioned','motivated','movements','naturally',
  'objective','obviously','operation','organized','otherwise','ownership',
  'paragraph','perfectly','performed','permanent','permitted','plaintext','potential','practical','precisely','preferred','presented','primarily','principle','procedure','prominent','providing',
  'recurring','reflected','regulated','rejection','resources','respected','resulting','retention','returning','righteous',
  'sacrifice','satisfied','scattered','secretary','seemingly','selection','sensitive','separated','sequenced','seriously','sincerely','situation','somewhere','spreading','standards','statement','strategic','streaming','surprised','surviving',
  'temporary','territory','thousands','tradition','transform','treatment','tremendous',
  'uncertain','universal','unlimited','upheaval',
  'violation','virtually',
  'worldwide',

  // 10-letter
  'accidental','accomplish','additional','aggressive','appearance','appreciate','approached','associated','attractive','autonomous',
  'beneficial','bipartisan',
  'capitalize','commitment','completely','concession','connection','consistent','contribute','controlled','convenient','coordinate','corruption',
  'decoration','dependency','determined','developing','difference','discussion','dismantled','distribute',
  'elementary','encouraged','enterprise','everything','everywhere','excitement','exhausted','expedition',
  'foundation','governance','guidelines',
  'immediately','impossible','impression','initiative','integrated','interested','investment',
  'journalism','leadership','likelihood',
  'maintained','management','membership','monitoring','motivation',
  'obligation','occurrence','oppression','opposition','originated',
  'parliament','percentage','permission','persistent','politician','population','preferably','presenting','progression','prohibited','protection','publishing',
  'reasonable','recognized','recommendation','referendum','regardless','remarkable','repeatedly','reputation','resolution','responsive','restoration','revelation',
  'separately','settlement','stakeholder','statistics','substantial','successful','summarized','supplement','sustainable',
  'thoroughly','throughout','traditional','transition','tremendous',
  'ultimately','understand','unexpected','unreliable',
  'validation','vocabulary',
  'withdrawal','worldwide',

  // Extended: common words missing from basic lists
  // Food & culture
  'sushi','pizza','pasta','taco','tacos','ramen','kebab','tapas','salsa','tofu','sashimi','burrito','burritos',
  // Gems & minerals
  'sapphire','sapphires','amethyst','emerald','emeralds','diamond','diamonds','crystal','crystals','topaz','garnet','garnets','ruby','rubies','quartz','opal','opals','tourmaline',
  // Common verbs / gerunds
  'hitchhike','hitchhiked','hitchhiker','hitchhikers','hitchhiking',
  'highlight','highlights','highlighted','highlighting','highlighter','highlighters',
  'inhibit','inhibits','inhibited','inhibiting','inhibition','inhibitor',
  'exhibit','exhibits','exhibited','exhibiting','exhibition','exhibitions',
  'prohibit','prohibits','prohibited','prohibiting','prohibition',
  'membership','memberships',
  'nightlight','nightlights','nightclub','nightclubs','nightclubbing',
  'birthright','birthrights',
  'copyright','copyrights',
  'playwright','playwrights',
  'lighthouse','lighthouses',
  'hummingbird','hummingbirds',
  'basketball','basketballs',
  'strawberry','strawberries',
  'blueberry','blueberries',
  'blackberry','blackberries',
  'gooseberry','gooseberries',
  'raspberry','raspberries',
  'cranberry','cranberries',
  'waterfall','waterfalls',
  'thunderstorm','thunderstorms',
  'earthquake','earthquakes',
  'snowflake','snowflakes',
  'moonlight','moonlights','moonlit',
  'starlight','starlights',
  'sunlight','sunlights',
  'fireplace','fireplaces',
  'fingertip','fingertips',
  'fingernail','fingernails',
  'thumbnail','thumbnails',
  'toothbrush','toothbrushes',
  'toothpaste','toothpastes',
  'newspaper','newspapers',
  'paperback','paperbacks',
  'hardcover','hardcovers',
  'bookshelf','bookshelves',
  'bookstore','bookstores',
  'supermarket','supermarkets',
  'underground','undergrounds',
  'understand','understands','understood','understanding',
  'outstanding','outstandingly',
  'overlapping','overlapped',
  'partnership','partnerships',
  'championship','championships',
  'scholarship','scholarships',
  'fellowship','fellowships',
  'friendship','friendships',
  'citizenship','citizenships',
  'relationship','relationships',
  'workmanship',
  'sportsmanship',
  'craftsmanship',
  'entrepreneurship',
  'leadership','leaderships',
  'censorship','censorships',
  'dictatorship','dictatorships',
  'township','townships',
  'worship','worships','worshiped','worshiping','worshipper',
  'hardship','hardships',
  'horsemanship',
  'marksmanship',
  'salesmanship',
  'penmanship',
  'kinship','kinships',
  'flagship','flagships',
  'courtship','courtships',
  'readership','readerships',
  'ownership','ownerships',
  'scholarship',
  'authorship','authorships',
  'viewership','viewerships',
  'clerkship',
  'trusteeship',
  'apprenticeship','apprenticeships',
  'partnership',
  'sponsorship','sponsorships',
  'chairmanship',
  'judgeship','judgeships',
  'ambassadorship',
  'professorship','professorships',
  'governorship','governorships',
  'internship','internships',
  'fellowship',
  'mentorship','mentorships',
  'stewardship','stewardships',
  'guardianship','guardianships',
  'companionship','companionships',
  'comradeship',
  // Common compound/long words
  'breakfast','breakfasts',
  'afternoon','afternoons',
  'overnight','overnights',
  'birthplace','birthplaces',
  'birthdate','birthdates',
  'birthday','birthdays',
  'childhood','childhoods',
  'adulthood','adulthoods',
  'neighborhood','neighborhoods',
  'brotherhood','brotherhoods',
  'sisterhood','sisterhoods',
  'motherhood','fatherhood',
  'knighthood','knighthoods',
  'likelihood','likelihoods',
  'falsehood','falsehoods',
  'livelihood','livelihoods',
  'manhood','womanhood',
  'statehood','statehoods',
  'nationhood',
  'parenthood','parenthoods',
  'selfhood',
  'personhood',
  'childhood',
  // Common 11-15 letter words
  'accomplishment','accomplishments',
  'advertisement','advertisements',
  'approximately','approximation',
  'breakthrough','breakthroughs',
  'circumstance','circumstances',
  'communication','communications',
  'concentration','concentrations',
  'configuration','configurations',
  'consideration','considerations',
  'consolidation','consolidations',
  'contamination','contaminations',
  'determination','determinations',
  'disappointment','disappointments',
  'establishment','establishments',
  'exaggeration','exaggerations',
  'extraordinary','extraordinarily',
  'globalization','globalizations',
  'gravitational','gravitationally',
  'hallucination','hallucinations',
  'implementation','implementations',
  'incorporation','incorporations',
  'individualism','individualist',
  'individuality','individualize',
  'infringement','infringements',
  'infrastructure','infrastructures',
  'international','internationally',
  'interpretation','interpretations',
  'investigation','investigations',
  'manifestation','manifestations',
  'marginalization',
  'misunderstanding','misunderstandings',
  'multiplication','multiplications',
  'nationalization',
  'nevertheless','nonetheless',
  'notifications',
  'objectification',
  'opportunities',
  'organizations',
  'participation','participations',
  'personalization',
  'phenomenological',
  'polarization','polarizations',
  'precipitation','precipitations',
  'predetermination',
  'preponderance','preponderances',
  'prioritization',
  'privatization','privatizations',
  'proliferation','proliferations',
  'proportionate','proportionately',
  'qualification','qualifications',
  'rationalization',
  'recommendation','recommendations',
  'reconciliation','reconciliations',
  'regeneration','regenerations',
  'reinforcement','reinforcements',
  'remembrance','remembrances',
  'representation','representations',
  'responsibility','responsibilities',
  'revolutionize','revolutionizes','revolutionized',
  'satisfaction','satisfactions',
  'standardization',
  'straightforward','straightforwardly',
  'subordination','subordinations',
  'superintendent','superintendents',
  'sustainability','sustainabilities',
  'symbolization','symbolizations',
  'transformation','transformations',
  'transportation','transportations',
  'underestimate','underestimates','underestimated',
  'vulnerability','vulnerabilities',
  'worthwhile','worthwhileness',
];

const WORD_DICTIONARY = new Set(WORDS.map(w => w.toLowerCase()));

// Build prefix set for fast pruning
const PREFIX_SET = new Set();
for (const w of WORD_DICTIONARY) {
  for (let i = 1; i < w.length; i++) {
    PREFIX_SET.add(w.slice(0, i));
  }
}

// ── EXTENDED DICTIONARY LOADER ────────────────────────────────
let dictLoaded = false;
let dictLoadPromise = null;

async function loadExtendedDictionary() {
  if (dictLoaded) return;
  if (!dictLoadPromise) {
    dictLoadPromise = (async () => {
      try {
        // Fetch 370k word list
        const res = await fetch('https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt');
        const text = await res.text();
        const words = text.split(/\r?\n/).map(w => w.trim().toLowerCase());
        
        let added = 0;
        for (const w of words) {
          if (w.length >= 3 && w.length <= 15 && !WORD_DICTIONARY.has(w)) {
            WORD_DICTIONARY.add(w);
            added++;
          }
        }
        
        PREFIX_SET.clear();
        for (const w of WORD_DICTIONARY) {
          for (let i = 1; i < w.length; i++) {
            PREFIX_SET.add(w.slice(0, i));
          }
        }
        dictLoaded = true;
        console.log(`[Wend Solver] Loaded ${added} extended words.`);
      } catch (e) {
        console.error('[Wend Solver] Failed to load extended dictionary:', e);
      }
    })();
  }
  return dictLoadPromise;
}

// Start loading dictionary in background immediately
loadExtendedDictionary();

// ── MESSAGE LISTENER ────────────────────────────────────────
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // CROP_DONE: relay from content script → side panel
  // (Content scripts can't send directly to side panels, must go via background)
  if (request.action === 'CROP_DONE') {
    // Broadcast to all extension views (side panel, popup)
    chrome.runtime.sendMessage(request).catch(() => {});
    return false;
  }

  // CAPTURE TAB
  if (request.action === 'captureTab') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs?.length) { sendResponse({ error: 'No active tab' }); return; }
      chrome.tabs.captureVisibleTab(tabs[0].windowId, { format: 'png' }, (dataUrl) => {
        if (chrome.runtime.lastError) sendResponse({ error: chrome.runtime.lastError.message });
        else sendResponse({ dataUrl });
      });
    });
    return true;
  }

  // FREE SOLVE — finds any valid words in the grid
  if (request.action === 'solvePuzzle') {
    const { grid } = request;
    (async () => {
      try {
        await loadExtendedDictionary();
        if (!grid?.length) { sendResponse({ success: false, error: 'Invalid grid', results: [] }); return; }
        sendResponse({ success: true, results: solveFree(grid) });
      } catch (e) { sendResponse({ success: false, error: e.message, results: [] }); }
    })();
    return true;
  }

  // WEND SOLVE — covers ALL cells with exact words of given lengths
  if (request.action === 'solveWend') {
    const { grid, wordLengths } = request;
    (async () => {
      try {
        await loadExtendedDictionary();
        if (!grid?.length || !wordLengths?.length) {
          sendResponse({ success: false, error: 'Invalid input', results: [] });
          return;
        }
        const result = solveWend(grid, wordLengths);
        if (result.error) {
          sendResponse({ success: false, error: result.error, results: [] });
        } else {
          sendResponse({ success: true, results: result });
        }
      } catch (e) { sendResponse({ success: false, error: e.message, results: [] }); }
    })();
    return true;
  }

  // SOLVE SUDOKU — backtracking solver
  if (request.action === 'solveSudoku') {
    const { board, size } = request;
    try {
      if (!board || board.length !== size) {
        sendResponse({ success: false, error: `Invalid board: need ${size}×${size} array.` });
        return true;
      }
      const solution = solveSudokuBoard(board, size);
      if (solution) {
        sendResponse({ success: true, solution });
      } else {
        sendResponse({ success: false, error: 'No solution exists. Check the given digits.' });
      }
    } catch (e) { sendResponse({ success: false, error: e.message }); }
    return true;
  }

  // SOLVE ZIP
  if (request.action === 'solveZip') {
    const { grid, hWalls, vWalls } = request;
    const hwSet = new Set(hWalls || []);
    const vwSet = new Set(vWalls || []);
    try {
      if (!grid?.length) { sendResponse({ success: false, error: 'Invalid grid', results: [] }); return true; }
      const results = solveZipGrid(grid, hwSet, vwSet);
      if (results.error) {
        sendResponse({ success: false, error: results.error, results: [] });
      } else {
        sendResponse({ success: true, results });
      }
    } catch (e) { sendResponse({ success: false, error: e.message, results: [] }); }
    return true;
  }

  return true;
});

// ── FREE SOLVER (word search) ────────────────────────────────
function solveFree(grid) {
  const rows = grid.length, cols = grid[0].length;
  const solutions = [];
  const seen = new Set();
  const visited = new Set();

  function dfs(r, c, word, path, targetLen) {
    const k = `${r},${c}`;
    if (visited.has(k)) return;
    const ch = grid[r]?.[c];
    if (!ch || ch === '#' || ch === '?') return;

    visited.add(k);
    const newWord = word + ch.toLowerCase();
    path.push([r, c]);

    if (newWord.length === targetLen) {
      if (WORD_DICTIONARY.has(newWord) && !seen.has(newWord)) {
        seen.add(newWord);
        solutions.push({ word: newWord, path: [...path] });
      }
    } else if (PREFIX_SET.has(newWord)) {
      for (const [nr, nc] of neighbors(grid, r, c)) {
        dfs(nr, nc, newWord, path, targetLen);
      }
    }

    path.pop();
    visited.delete(k);
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] !== '#' && grid[r][c] !== '?') {
        for (let len = 3; len <= 8; len++) {
          dfs(r, c, '', [], len);
        }
      }
    }
  }

  return solutions.sort((a, b) => b.word.length - a.word.length || a.word.localeCompare(b.word));
}

// ── WEND SOLVER (constrained: all cells covered, exact word lengths) ──
function solveWend(grid, wordLengths) {
  const rows = grid.length, cols = grid[0].length;

  // Count valid cells (letters + unknown '?' cells)
  let validCount = 0;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (grid[r][c] !== '#') validCount++;

  const totalLen = wordLengths.reduce((a, b) => a + b, 0);
  if (totalLen !== validCount) {
    return { error: `Word lengths sum to ${totalLen} but grid has ${validCount} valid cells. Check the counts.` };
  }

  // Sort longest word first for better pruning
  const lengths = [...wordLengths].sort((a, b) => b - a);

  const used = Array.from({ length: rows }, () => new Array(cols).fill(false));
  const solutions = [];
  const words = [];

  // dfsWord: build a single word starting at (r,c)
  // lastCell: the last cell of the *previous* word (or null for first word)
  function dfsWord(r, c, word, path, targetLen, lenIdx) {
    if (solutions.length >= 5) return;

    if (word.length === targetLen) {
      if (WORD_DICTIONARY.has(word)) {
        words.push({ word, path: path.map(p => [...p]) });
        backtrack(lenIdx + 1);
        words.pop();
      }
      return;
    }

    if (!PREFIX_SET.has(word)) return;

    for (const [nr, nc] of neighbors(grid, r, c)) {
      if (!used[nr][nc]) {
        used[nr][nc] = true;
        path.push([nr, nc]);
        const ch = grid[nr][nc];
        if (ch === '?') {
          for (let i = 0; i < 26; i++) {
            const letter = String.fromCharCode(97 + i);
            dfsWord(nr, nc, word + letter, path, targetLen, lenIdx);
            if (solutions.length >= 5) break;
          }
        } else {
          dfsWord(nr, nc, word + ch.toLowerCase(), path, targetLen, lenIdx);
        }
        path.pop();
        used[nr][nc] = false;
        if (solutions.length >= 5) return;
      }
    }
  }

  // backtrack: place the next word
  function backtrack(lenIdx) {
    if (solutions.length >= 5) return;

    if (lenIdx === lengths.length) {
      // Verify all valid (non-blocked) cells are used
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
          if (grid[r][c] !== '#' && !used[r][c]) return;
      solutions.push(words.map(w => ({ word: w.word, path: w.path })));
      return;
    }

    const targetLen = lengths[lenIdx];

    // Prune: if there is any isolated unused cell (0 unused neighbors),
    // and we still have words left to place, we can abort early.
    // (Words are always >= 3 letters, so an isolated cell can never be covered).
    let minUnusedNeighbors = Infinity;
    let unusedCount = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!used[r][c] && grid[r][c] !== '#') {
          unusedCount++;
          let freeNeighbors = 0;
          for (const [nr, nc] of neighbors(grid, r, c)) {
            if (!used[nr][nc]) freeNeighbors++;
          }
          if (freeNeighbors < minUnusedNeighbors) minUnusedNeighbors = freeNeighbors;
        }
      }
    }
    if (unusedCount > 0 && minUnusedNeighbors === 0 && targetLen > 1) {
      return; 
    }

    // Try all unused cells as starting points for this word
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!used[r][c] && grid[r][c] !== '#') {
          used[r][c] = true;
          const ch = grid[r][c];
          if (ch === '?') {
            for (let i = 0; i < 26 && solutions.length < 5; i++) {
              dfsWord(r, c, String.fromCharCode(97 + i), [[r, c]], targetLen, lenIdx);
            }
          } else {
            dfsWord(r, c, ch.toLowerCase(), [[r, c]], targetLen, lenIdx);
          }
          used[r][c] = false;
          if (solutions.length >= 5) return;
        }
      }
    }
  }

  backtrack(0);
  return solutions;
}

// ── HELPERS ──────────────────────────────────────────────────
function neighbors(grid, r, c) {
  const result = [];
  for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    const nr = r + dr, nc = c + dc;
    if (nr >= 0 && nr < grid.length && nc >= 0 && nc < grid[nr].length &&
        grid[nr][nc] !== '#') {
      result.push([nr, nc]);
    }
  }
  return result;
}

// ── SUDOKU SOLVER (backtracking) ────────────────────────────
function solveSudokuBoard(inputBoard, size) {
  const g = inputBoard.map(row => [...row]);
  
  // 6x6 boxes are 2 rows x 3 cols. 9x9 boxes are 3 rows x 3 cols.
  const boxRows = size === 6 ? 2 : 3;
  const boxCols = 3;

  function isValid(row, col, num) {
    // Row
    for (let c = 0; c < size; c++) if (g[row][c] === num) return false;
    // Column
    for (let r = 0; r < size; r++) if (g[r][col] === num) return false;
    // Box
    const br = Math.floor(row / boxRows) * boxRows;
    const bc = Math.floor(col / boxCols) * boxCols;
    for (let r = br; r < br + boxRows; r++)
      for (let c = bc; c < bc + boxCols; c++)
        if (g[r][c] === num) return false;
    return true;
  }

  function solve() {
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (g[row][col] === 0) {
          for (let n = 1; n <= size; n++) {
            if (isValid(row, col, n)) {
              g[row][col] = n;
              if (solve()) return true;
              g[row][col] = 0;
            }
          }
          return false; // Dead end
        }
      }
    }
    return true; // All cells filled
  }

  return solve() ? g : null;
}

// ── ZIP SOLVER (Hamiltonian Path with BFS pruning) ───────────
function solveZipGrid(grid, hWalls = new Set(), vWalls = new Set()) {
  const rows = grid.length;
  const cols = grid[0].length;
  
  let maxNum = 0;
  let startR = -1, startC = -1;
  let totalValid = 0;
  const numPos = {}; // target -> [r, c]

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] !== '#') {
        totalValid++;
        if (typeof grid[r][c] === 'number') {
          const n = grid[r][c];
          numPos[n] = [r, c];
          if (n > maxNum) maxNum = n;
          if (n === 1) { startR = r; startC = c; }
        }
      }
    }
  }

  if (startR === -1 || maxNum < 2) return { error: "Must have at least numbers 1 and 2." };
  for (let i = 1; i <= maxNum; i++) {
    if (!numPos[i]) return { error: `Missing number ${i}.` };
  }

  const visited = Array.from({length: rows}, () => new Array(cols).fill(false));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === '#') visited[r][c] = true;
    }
  }

  const path = [];
  const solutions = [];

  function canMove(r, c, nr, nc) {
    if (nr === r + 1) return !hWalls.has(`${r},${c}`);
    if (nr === r - 1) return !hWalls.has(`${nr},${c}`);
    if (nc === c + 1) return !vWalls.has(`${r},${c}`);
    if (nc === c - 1) return !vWalls.has(`${r},${nc}`);
    return true;
  }

  function isConnected(unvisitedCount) {
    let sr = -1, sc = -1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!visited[r][c]) { sr = r; sc = c; break; }
      }
      if (sr !== -1) break;
    }
    if (sr === -1) return true;

    let count = 0;
    const q = [[sr, sc]];
    const seen = Array.from({length: rows}, () => new Array(cols).fill(false));
    seen[sr][sc] = true;

    let head = 0;
    while (head < q.length) {
      const [r, c] = q[head++];
      count++;
      for (const [nr, nc] of [[r-1,c], [r+1,c], [r,c-1], [r,c+1]]) {
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc] && !seen[nr][nc] && canMove(r, c, nr, nc)) {
          seen[nr][nc] = true;
          q.push([nr, nc]);
        }
      }
    }
    return count === unvisitedCount;
  }

  function dfs(r, c, currentTarget, unvisitedCount) {
    if (solutions.length > 0) return;

    visited[r][c] = true;
    path.push([r, c]);
    unvisitedCount--;

    const isTarget = (grid[r][c] === currentTarget);
    const nextTarget = isTarget ? currentTarget + 1 : currentTarget;

    if (unvisitedCount === 0 && currentTarget >= maxNum) {
      solutions.push([...path]);
      visited[r][c] = false;
      path.pop();
      return;
    }

    if (unvisitedCount > 0 && !isConnected(unvisitedCount)) {
      visited[r][c] = false;
      path.pop();
      return;
    }

    if (nextTarget <= maxNum) {
      const [tr, tc] = numPos[nextTarget];
      const dist = Math.abs(r - tr) + Math.abs(c - tc);
      if (dist > unvisitedCount) {
        visited[r][c] = false;
        path.pop();
        return;
      }
    }

    for (const [nr, nc] of [[r-1,c], [r+1,c], [r,c-1], [r,c+1]]) {
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc] && canMove(r, c, nr, nc)) {
        const cellVal = grid[nr][nc];
        if (typeof cellVal === 'number') {
          if (cellVal === nextTarget) dfs(nr, nc, nextTarget, unvisitedCount);
        } else {
          dfs(nr, nc, nextTarget, unvisitedCount);
        }
      }
    }

    visited[r][c] = false;
    path.pop();
  }

  dfs(startR, startC, 1, totalValid);
  return solutions;
}

console.log('[Wend Solver v3] Background initialized —', WORD_DICTIONARY.size, 'words');
