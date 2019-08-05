const cheerio = require('cheerio')

let data = `<!DOCTYPE html>
<html class=" responsive" lang="en">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
			<meta name="viewport" content="width=device-width,initial-scale=1">
		<meta name="theme-color" content="#171a21">
		<title>Steam Community :: Steam Badges</title>
	<link rel="shortcut icon" href="/favicon.ico" type="image/x-icon">

	
	
	<link href="https://steamcommunity-a.akamaihd.net/public/shared/css/motiva_sans.css?v=FAK4O46_mOLB&amp;l=english" rel="stylesheet" type="text/css" >
<link href="https://steamcommunity-a.akamaihd.net/public/shared/css/buttons.css?v=6uRURryOh96m&amp;l=english" rel="stylesheet" type="text/css" >
<link href="https://steamcommunity-a.akamaihd.net/public/shared/css/shared_global.css?v=O5W-K8wVvTcv&amp;l=english" rel="stylesheet" type="text/css" >
<link href="https://steamcommunity-a.akamaihd.net/public/css/globalv2.css?v=KRH2BKcRYm07&amp;l=english" rel="stylesheet" type="text/css" >
<link href="https://steamcommunity-a.akamaihd.net/public/shared/css/motiva_sans.css?v=FAK4O46_mOLB&amp;l=english" rel="stylesheet" type="text/css" >
<link href="https://steamcommunity-a.akamaihd.net/public/css/skin_1/profilev2.css?v=ztMS8b4EN1z7&amp;l=english" rel="stylesheet" type="text/css" >
<link href="https://steamcommunity-a.akamaihd.net/public/css/skin_1/badges.css?v=0qywCbjJe76B&amp;l=english" rel="stylesheet" type="text/css" >
<link href="https://steamcommunity-a.akamaihd.net/public/shared/css/shared_responsive.css?v=RsYy34X2p1SM&amp;l=english" rel="stylesheet" type="text/css" >
<link href="https://steamcommunity-a.akamaihd.net/public/css/skin_1/header.css?v=Bv4kKK3Pxl5t&amp;l=english" rel="stylesheet" type="text/css" >
			<script>
				(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
						(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
					m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
				})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

				ga('create', 'UA-33779068-1', 'auto', {
					'sampleRate': 0.4				});
				ga('set', 'dimension1', true );
				ga('set', 'dimension2', 'External' );
				ga('set', 'dimension3', 'profiles' );
				ga('set', 'dimension4', "profiles\/badges" );
				ga('send', 'pageview' );

			</script>
			<script type="text/javascript" src="https://steamcommunity-a.akamaihd.net/public/javascript/prototype-1.7.js?v=.55t44gwuwgvw" ></script>
<script type="text/javascript" src="https://steamcommunity-a.akamaihd.net/public/javascript/scriptaculous/_combined.js?v=OeNIgrpEF8tL&amp;l=english&amp;load=effects,controls,slider,dragdrop" ></script>
<script type="text/javascript" src="https://steamcommunity-a.akamaihd.net/public/javascript/global.js?v=__mj5Gj4n0D0&amp;l=english" ></script>
<script type="text/javascript" src="https://steamcommunity-a.akamaihd.net/public/javascript/jquery-1.11.1.min.js?v=.isFTSRckeNhC" ></script>
<script type="text/javascript" src="https://steamcommunity-a.akamaihd.net/public/shared/javascript/tooltip.js?v=.vG8yiuBTGwkE" ></script>
<script type="text/javascript" src="https://steamcommunity-a.akamaihd.net/public/shared/javascript/shared_global.js?v=ABxipdIJaVDu&amp;l=english" ></script>
<script type="text/javascript">$J = jQuery.noConflict();
if ( typeof JSON != 'object' || !JSON.stringify || !JSON.parse ) { document.write( "<scr" + "ipt type=\"text\/javascript\" src=\"https:\/\/steamcommunity-a.akamaihd.net\/public\/javascript\/json2.js?v=pmScf4470EZP&amp;l=english\" ><\/script>\n" ); };
</script>
		<script type="text/javascript">
			document.addEventListener('DOMContentLoaded', function(event) {  
				SetupTooltips( { tooltipCSSClass: 'community_tooltip'} ); 
		});
		</script><script type="text/javascript" src="https://steamcommunity-a.akamaihd.net/public/javascript/badges.js?v=-Zsw_HAIScRE&amp;l=english" ></script>
<script type="text/javascript" src="https://steamcommunity-a.akamaihd.net/public/shared/javascript/shared_responsive_adapter.js?v=TbBMCK37KgCo&amp;l=english" ></script>

						<meta name="twitter:card" content="summary">
					<meta name="Description" content="BotFarmer[1] has unlocked 7 badges on Steam, for a total of 968 XP.  Steam Level: 9.">
			
	<meta name="twitter:site" content="@steam_games" />

						<meta property="og:title" content="BotFarmer[1]'s Steam Badges">
					<meta property="twitter:title" content="Steam Community :: Steam Badges">
					<meta property="fb:app_id" content="105386699540688">
					<meta property="og:description" content="BotFarmer[1] has unlocked 7 badges on Steam, for a total of 968 XP.  Steam Level: 9.">
					<meta property="twitter:description" content="BotFarmer[1] has unlocked 7 badges on Steam, for a total of 968 XP.  Steam Level: 9.">
			
	
			<link rel="image_src" href="https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/fe/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_medium.jpg">
		<link rel="image_src" href="https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/fe/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_medium.jpg">
		<meta property="og:image" content="https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/fe/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_medium.jpg">
		<meta name="twitter:image" content="https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/fe/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_medium.jpg" />
		
	
	
	
	</head>
<body class="flat_page responsive_page">

<div class="responsive_page_frame with_header">

						<div class="responsive_page_menu_ctn mainmenu">
				<div class="responsive_page_menu"  id="responsive_page_menu">
										<div class="mainmenu_contents">
						<div class="mainmenu_contents_items">
															<!-- profile area -->
								<div class="responsive_menu_user_area">
									<div class="responsive_menu_user_persona persona offline">
										<div class="playerAvatar offline">
											<a href="https://steamcommunity.com/profiles/76561197964552011/">
												<img src="https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/fe/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb.jpg" srcset="https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/fe/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb.jpg 1x, https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/fe/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_medium.jpg 2x">											</a>
										</div>
										<a href="https://steamcommunity.com/profiles/76561197964552011/" data-miniprofile="4286283">BotFarmer[1]</a>									</div>

																										</div>

																									<div class="menuitem notifications_item">
										Notifications										<div class="notification_count_total_ctn has_notifications">
											<span class="notification_envelope"></span>
											<span class="notification_count">4</span>
										</div>
									</div>
									<div class="notification_submenu" style="display: none;" data-submenuid="notifications">
										
							<a data-notification-type="4" class="popup_menu_item notification_ctn header_notification_comments " href="https://steamcommunity.com/profiles/76561197964552011/commentnotifications/">
				<span class="notification_icon"></span>New comments <span class="notification_count">0</span>			</a>
			<div class="header_notification_dropdown_seperator"></div>
						<a data-notification-type="5" class="popup_menu_item notification_ctn header_notification_items active_inbox_item" href="https://steamcommunity.com/profiles/76561197964552011/inventory/">
				<span class="notification_icon"></span>New items <span class="notification_count">4</span>			</a>
			<div class="header_notification_dropdown_seperator"></div>
						<a data-notification-type="6" class="popup_menu_item notification_ctn header_notification_invites " href="https://steamcommunity.com/profiles/76561197964552011/home/invites/">
				<span class="notification_icon"></span>New invites <span class="notification_count">0</span>			</a>
			<div class="header_notification_dropdown_seperator"></div>
						<a data-notification-type="8" class="popup_menu_item notification_ctn header_notification_gifts " href="https://steamcommunity.com/profiles/76561197964552011/inventory/#pending_gifts">
				<span class="notification_icon"></span>New gifts <span class="notification_count">0</span>			</a>
			<div class="header_notification_dropdown_seperator"></div>
						<a data-notification-type="9" class="popup_menu_item notification_ctn header_notification_offlinemessages " href="javascript:void(0)" onclick="LaunchWebChat(); HideMenu( 'header_notification_link', 'header_notification_dropdown' ); return false;">
				<span class="notification_icon"></span>New messages <span class="notification_count">0</span>			</a>
								<a data-notification-type="1" class="popup_menu_item notification_ctn hide_when_empty header_notification_tradeoffers " href="https://steamcommunity.com/profiles/76561197964552011/tradeoffers/">
						<div class="header_notification_dropdown_seperator"></div>
						<span class="notification_icon"></span>New trade offers <span class="notification_count">0</span>					</a>
								<a data-notification-type="2" class="popup_menu_item notification_ctn hide_when_empty header_notification_asyncgame " href="https://steamcommunity.com/profiles/76561197964552011/gamenotifications">
						<div class="header_notification_dropdown_seperator"></div>
						<span class="notification_icon"></span>New turns waiting <span class="notification_count">0</span>					</a>
								<a data-notification-type="3" class="popup_menu_item notification_ctn hide_when_empty header_notification_moderatormessage " href="https://steamcommunity.com/profiles/76561197964552011/moderatormessages">
						<div class="header_notification_dropdown_seperator"></div>
						<span class="notification_icon"></span>New community messages <span class="notification_count">0</span>					</a>
								<a data-notification-type="10" class="popup_menu_item notification_ctn hide_when_empty header_notification_helprequestreply " href="https://help.steampowered.com/en/wizard/HelpRequests">
						<div class="header_notification_dropdown_seperator"></div>
						<span class="notification_icon"></span>Steam Support replies <span class="notification_count">0</span>					</a>
													</div>
									<a class="menuitem supernav" href="https://store.steampowered.com/" data-tooltip-type="selector" data-tooltip-content=".submenu_store">
		Store	</a>
	<div class="submenu_store" style="display: none;" data-submenuid="store">
		<a class="submenuitem" href="https://store.steampowered.com/">Featured</a>
		<a class="submenuitem" href="https://store.steampowered.com/explore/">Explore</a>
		<a class="submenuitem" href="https://store.steampowered.com/curators/">Curators</a>
		<a class="submenuitem" href="https://steamcommunity.com/my/wishlist/">Wishlist</a>
		<a class="submenuitem" href="https://store.steampowered.com/news/">News</a>
		<a class="submenuitem" href="https://store.steampowered.com/stats/">Stats</a>
			</div>


	<a class="menuitem supernav" style="display: block" href="https://steamcommunity.com/" data-tooltip-type="selector" data-tooltip-content=".submenu_community">
		Community	</a>
	<div class="submenu_community" style="display: none;" data-submenuid="community">
		<a class="submenuitem" href="https://steamcommunity.com/">Home</a>
		<a class="submenuitem" href="https://steamcommunity.com/discussions/">Discussions</a>
		<a class="submenuitem" href="https://steamcommunity.com/workshop/">Workshop</a>
		<a class="submenuitem" href="https://steamcommunity.com/market/">Market</a>
		<a class="submenuitem" href="https://steamcommunity.com/?subsection=broadcasts">Broadcasts</a>
					</div>

	

			<a class="menuitem supernav username" href="https://steamcommunity.com/profiles/76561197964552011/home/" data-tooltip-type="selector" data-tooltip-content=".submenu_username">
			You &amp; Friends		</a>
		<div class="submenu_username" style="display: none;" data-submenuid="username">
			<a class="submenuitem" href="https://steamcommunity.com/profiles/76561197964552011/home/">Activity</a>
			<a class="submenuitem" href="https://steamcommunity.com/profiles/76561197964552011/">Profile</a>
			<a class="submenuitem" href="https://steamcommunity.com/profiles/76561197964552011/friends/">Friends</a>
			<a class="submenuitem" href="https://steamcommunity.com/profiles/76561197964552011/groups/">Groups</a>
			<a class="submenuitem" href="https://steamcommunity.com/profiles/76561197964552011/screenshots/">Content</a>
			<a class="submenuitem" href="https://steamcommunity.com/profiles/76561197964552011/badges/">Badges</a>
			<a class="submenuitem" href="https://steamcommunity.com/profiles/76561197964552011/inventory/">Inventory</a>
		</div>
	
	
	<a class="menuitem" href="https://help.steampowered.com/en/">
		Support	</a>

							<div class="minor_menu_items">
																	<a class="menuitem" href="https://store.steampowered.com/account/">Account details</a>
									<a class="menuitem" href="https://store.steampowered.com/account/preferences">Preferences</a>
																<div class="menuitem change_language_action">
									Change language								</div>
																	<div class="menuitem" onclick="Logout();">Change User</div>
																									<div class="menuitem" onclick="Responsive_RequestDesktopView();">
										View desktop website									</div>
															</div>
						</div>
						<div class="mainmenu_footer_spacer"></div>
						<div class="mainmenu_footer">
							<div class="mainmenu_footer_logo"><img src="https://steamcommunity-a.akamaihd.net/public/shared/images/responsive/logo_valve_footer.png"></div>
							© Valve Corporation. All rights reserved. All trademarks are property of their respective owners in the US and other countries.							<span class="mainmenu_valve_links">
								<a href="https://store.steampowered.com/privacy_agreement/" target="_blank">Privacy Policy</a>
								&nbsp;| &nbsp;<a href="http://www.valvesoftware.com/legal.htm" target="_blank">Legal</a>
								&nbsp;| &nbsp;<a href="https://store.steampowered.com/subscriber_agreement/" target="_blank">Steam Subscriber Agreement</a>
								&nbsp;| &nbsp;<a href="https://store.steampowered.com/steam_refunds/" target="_blank">Refunds</a>
							</span>
						</div>
					</div>
									</div>
			</div>
		
		<div class="responsive_local_menu_tab">

		</div>

		<div class="responsive_page_menu_ctn localmenu">
			<div class="responsive_page_menu"  id="responsive_page_local_menu">
				<div class="localmenu_content">
				</div>
			</div>
		</div>



					<div class="responsive_header">
				<div class="responsive_header_content">
					<div id="responsive_menu_logo">
						<img src="https://steamcommunity-a.akamaihd.net/public/shared/images/responsive/header_menu_hamburger.png" height="100%">
													<div class="responsive_header_notification_badge_ctn">
								<div class="responsive_header_notification_badge notification_count_total_ctn has_notifications">
									<span class="notification_count">4</span>
								</div>
							</div>
											</div>
					<div class="responsive_header_logo">
						<img src="https://steamcommunity-a.akamaihd.net/public/shared/images/responsive/header_logo.png" height="36" border="0" alt="STEAM">
					</div>
				</div>
			</div>
		
		<div class="responsive_page_content_overlay">

		</div>

		<div class="responsive_fixonscroll_ctn nonresponsive_hidden ">
		</div>
	
	<div class="responsive_page_content">

		<div id="global_header">
	<div class="content">
		<div class="logo">
			<span id="logo_holder">
									<a href="https://store.steampowered.com/">
						<img src="https://steamcommunity-a.akamaihd.net/public/shared/images/header/globalheader_logo.png?t=962016" width="176" height="44">
					</a>
							</span>
			<!--[if lt IE 7]>
			<style type="text/css">
				#logo_holder img { filter:progid:DXImageTransform.Microsoft.Alpha(opacity=0); }
				#logo_holder { display: inline-block; width: 176px; height: 44px; filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(src='https://steamcommunity-a.akamaihd.net/public/images/v5/globalheader_logo.png'); }
			</style>
			<![endif]-->
		</div>

			<div class="supernav_container">
	<a class="menuitem supernav" href="https://store.steampowered.com/" data-tooltip-type="selector" data-tooltip-content=".submenu_store">
		STORE	</a>
	<div class="submenu_store" style="display: none;" data-submenuid="store">
		<a class="submenuitem" href="https://store.steampowered.com/">Featured</a>
		<a class="submenuitem" href="https://store.steampowered.com/explore/">Explore</a>
		<a class="submenuitem" href="https://store.steampowered.com/curators/">Curators</a>
		<a class="submenuitem" href="https://steamcommunity.com/my/wishlist/">Wishlist</a>
		<a class="submenuitem" href="https://store.steampowered.com/news/">News</a>
		<a class="submenuitem" href="https://store.steampowered.com/stats/">Stats</a>
					<a class="submenuitem" href="https://store.steampowered.com/about/">ABOUT</a>
			</div>


	<a class="menuitem supernav" style="display: block" href="https://steamcommunity.com/" data-tooltip-type="selector" data-tooltip-content=".submenu_community">
		COMMUNITY	</a>
	<div class="submenu_community" style="display: none;" data-submenuid="community">
		<a class="submenuitem" href="https://steamcommunity.com/">Home</a>
		<a class="submenuitem" href="https://steamcommunity.com/discussions/">Discussions</a>
		<a class="submenuitem" href="https://steamcommunity.com/workshop/">Workshop</a>
		<a class="submenuitem" href="https://steamcommunity.com/market/">Market</a>
		<a class="submenuitem" href="https://steamcommunity.com/?subsection=broadcasts">Broadcasts</a>
					</div>

	

			<a class="menuitem supernav username" href="https://steamcommunity.com/profiles/76561197964552011/home/" data-tooltip-type="selector" data-tooltip-content=".submenu_username">
			BotFarmer[1]		</a>
		<div class="submenu_username" style="display: none;" data-submenuid="username">
			<a class="submenuitem" href="https://steamcommunity.com/profiles/76561197964552011/home/">Activity</a>
			<a class="submenuitem" href="https://steamcommunity.com/profiles/76561197964552011/">Profile</a>
			<a class="submenuitem" href="https://steamcommunity.com/profiles/76561197964552011/friends/">Friends</a>
			<a class="submenuitem" href="https://steamcommunity.com/profiles/76561197964552011/groups/">Groups</a>
			<a class="submenuitem" href="https://steamcommunity.com/profiles/76561197964552011/screenshots/">Content</a>
			<a class="submenuitem" href="https://steamcommunity.com/profiles/76561197964552011/badges/">Badges</a>
			<a class="submenuitem" href="https://steamcommunity.com/profiles/76561197964552011/inventory/">Inventory</a>
		</div>
	
						<a class="menuitem" href="https://steamcommunity.com/chat/">
				Chat			</a>
			
	<a class="menuitem" href="https://help.steampowered.com/en/">
		SUPPORT	</a>
	</div>
	<script type="text/javascript">
		jQuery(function($) {
			$('#global_header .supernav').v_tooltip({'location':'bottom', 'destroyWhenDone': false, 'tooltipClass': 'supernav_content', 'offsetY':-4, 'offsetX': 1, 'horizontalSnap': 4, 'tooltipParent': '#global_header .supernav_container', 'correctForScreenSize': false});
		});
	</script>

		<div id="global_actions">
			<div id="global_action_menu">
									<div class="header_installsteam_btn header_installsteam_btn_gray">

						<a class="header_installsteam_btn_content" href="https://store.steampowered.com/about/">
							Install Steam						</a>
					</div>
				
				
										<!-- notification inbox area -->
																								<div id="header_notification_area">
									<script type="text/javascript">$J(EnableNotificationCountPolling);</script>
		<div id="header_notification_link" class="header_notification_btn global_header_toggle_button notification_count_total_ctn has_notifications" onclick="ShowMenu( this, 'header_notification_dropdown', 'right' );">
			<span class="notification_count">4</span>
			<span class="header_notification_envelope">
				<img src="https://steamcommunity-a.akamaihd.net/public/shared/images/responsive/header_menu_notifications.png" width="11" height="8">
			</span>
		</div>
	
			<div class="popup_block_new" id="header_notification_dropdown" style="display: none;">
			<div class="popup_body popup_menu">
							<a data-notification-type="4" class="popup_menu_item notification_ctn header_notification_comments " href="https://steamcommunity.com/profiles/76561197964552011/commentnotifications/">
				<span class="notification_icon"></span><span class="notification_count_string singular" style="display: none;">1 new comment</span><span class="notification_count_string plural" style=""><span class="notification_count">0</span> new comments</span>			</a>
			<div class="header_notification_dropdown_seperator"></div>
						<a data-notification-type="5" class="popup_menu_item notification_ctn header_notification_items active_inbox_item" href="https://steamcommunity.com/profiles/76561197964552011/inventory/">
				<span class="notification_icon"></span><span class="notification_count_string singular" style="display: none;">1 new item in your inventory</span><span class="notification_count_string plural" style=""><span class="notification_count">4</span> new items in your inventory</span>			</a>
			<div class="header_notification_dropdown_seperator"></div>
						<a data-notification-type="6" class="popup_menu_item notification_ctn header_notification_invites " href="https://steamcommunity.com/profiles/76561197964552011/home/invites/">
				<span class="notification_icon"></span><span class="notification_count_string singular" style="display: none;">1 new invite</span><span class="notification_count_string plural" style=""><span class="notification_count">0</span> new invites</span>			</a>
			<div class="header_notification_dropdown_seperator"></div>
						<a data-notification-type="8" class="popup_menu_item notification_ctn header_notification_gifts " href="https://steamcommunity.com/profiles/76561197964552011/inventory/#pending_gifts">
				<span class="notification_icon"></span><span class="notification_count_string singular" style="display: none;">1 new gift</span><span class="notification_count_string plural" style=""><span class="notification_count">0</span> new gifts</span>			</a>
			<div class="header_notification_dropdown_seperator"></div>
						<a data-notification-type="9" class="popup_menu_item notification_ctn header_notification_offlinemessages " href="javascript:void(0)" onclick="LaunchWebChat(); HideMenu( 'header_notification_link', 'header_notification_dropdown' ); return false;">
				<span class="notification_icon"></span><span class="notification_count_string singular" style="display: none;">1 unread chat message</span><span class="notification_count_string plural" style=""><span class="notification_count">0</span> unread chat messages</span>			</a>
								<a data-notification-type="1" class="popup_menu_item notification_ctn hide_when_empty header_notification_tradeoffers " href="https://steamcommunity.com/profiles/76561197964552011/tradeoffers/">
						<div class="header_notification_dropdown_seperator"></div>
						<span class="notification_icon"></span><span class="notification_count_string singular" style="display: none;">1 new trade notification</span><span class="notification_count_string plural" style=""><span class="notification_count">0</span> new trade notifications</span>					</a>
								<a data-notification-type="2" class="popup_menu_item notification_ctn hide_when_empty header_notification_asyncgame " href="https://steamcommunity.com/profiles/76561197964552011/gamenotifications">
						<div class="header_notification_dropdown_seperator"></div>
						<span class="notification_icon"></span><span class="notification_count_string singular" style="display: none;">1 turn waiting</span><span class="notification_count_string plural" style=""><span class="notification_count">0</span> new turns waiting</span>					</a>
								<a data-notification-type="3" class="popup_menu_item notification_ctn hide_when_empty header_notification_moderatormessage " href="https://steamcommunity.com/profiles/76561197964552011/moderatormessages">
						<div class="header_notification_dropdown_seperator"></div>
						<span class="notification_icon"></span><span class="notification_count_string singular" style="display: none;">1 community message</span><span class="notification_count_string plural" style=""><span class="notification_count">0</span> community messages</span>					</a>
								<a data-notification-type="10" class="popup_menu_item notification_ctn hide_when_empty header_notification_helprequestreply " href="https://help.steampowered.com/en/wizard/HelpRequests">
						<div class="header_notification_dropdown_seperator"></div>
						<span class="notification_icon"></span><span class="notification_count_string singular" style="display: none;">1 reply from Steam Support</span><span class="notification_count_string plural" style=""><span class="notification_count">0</span> replies from Steam Support</span>					</a>
							</div>
		</div>
							</div>
					<span class="pulldown global_action_link" id="account_pulldown" onclick="ShowMenu( this, 'account_dropdown', 'right', 'bottom', true );">kylescsullivan@optonline.net</span>
					<div class="popup_block_new" id="account_dropdown" style="display: none;">
						<div class="popup_body popup_menu">
															<a class="popup_menu_item" href="javascript:Logout();">Logout</a>
																						<a class="popup_menu_item" href="https://store.steampowered.com/account/">Account details</a>
								<a class="popup_menu_item" href="https://store.steampowered.com/account/preferences/">Preferences</a>
														<span class="popup_menu_item" id="account_language_pulldown">Change language</span>
							<div class="popup_block_new" id="language_dropdown" style="display: none;">
								<div class="popup_body popup_menu">
																																									<a class="popup_menu_item tight" href="?l=schinese" onclick="ChangeLanguage( 'schinese' ); return false;">简体中文 (Simplified Chinese)</a>
																																<a class="popup_menu_item tight" href="?l=tchinese" onclick="ChangeLanguage( 'tchinese' ); return false;">繁體中文 (Traditional Chinese)</a>
																																<a class="popup_menu_item tight" href="?l=japanese" onclick="ChangeLanguage( 'japanese' ); return false;">日本語 (Japanese)</a>
																																<a class="popup_menu_item tight" href="?l=koreana" onclick="ChangeLanguage( 'koreana' ); return false;">한국어 (Korean)</a>
																																<a class="popup_menu_item tight" href="?l=thai" onclick="ChangeLanguage( 'thai' ); return false;">ไทย (Thai)</a>
																																<a class="popup_menu_item tight" href="?l=bulgarian" onclick="ChangeLanguage( 'bulgarian' ); return false;">Български (Bulgarian)</a>
																																<a class="popup_menu_item tight" href="?l=czech" onclick="ChangeLanguage( 'czech' ); return false;">Čeština (Czech)</a>
																																<a class="popup_menu_item tight" href="?l=danish" onclick="ChangeLanguage( 'danish' ); return false;">Dansk (Danish)</a>
																																<a class="popup_menu_item tight" href="?l=german" onclick="ChangeLanguage( 'german' ); return false;">Deutsch (German)</a>
																																<a class="popup_menu_item tight" href="?l=english" onclick="ChangeLanguage( 'english' ); return false;">English</a>
																																<a class="popup_menu_item tight" href="?l=spanish" onclick="ChangeLanguage( 'spanish' ); return false;">Español - España (Spanish - Spain)</a>
																																<a class="popup_menu_item tight" href="?l=latam" onclick="ChangeLanguage( 'latam' ); return false;">Español - Latinoamérica (Spanish - Latin America)</a>
																																<a class="popup_menu_item tight" href="?l=greek" onclick="ChangeLanguage( 'greek' ); return false;">Ελληνικά (Greek)</a>
																																<a class="popup_menu_item tight" href="?l=french" onclick="ChangeLanguage( 'french' ); return false;">Français (French)</a>
																																<a class="popup_menu_item tight" href="?l=italian" onclick="ChangeLanguage( 'italian' ); return false;">Italiano (Italian)</a>
																																<a class="popup_menu_item tight" href="?l=hungarian" onclick="ChangeLanguage( 'hungarian' ); return false;">Magyar (Hungarian)</a>
																																<a class="popup_menu_item tight" href="?l=dutch" onclick="ChangeLanguage( 'dutch' ); return false;">Nederlands (Dutch)</a>
																																<a class="popup_menu_item tight" href="?l=norwegian" onclick="ChangeLanguage( 'norwegian' ); return false;">Norsk (Norwegian)</a>
																																<a class="popup_menu_item tight" href="?l=polish" onclick="ChangeLanguage( 'polish' ); return false;">Polski (Polish)</a>
																																<a class="popup_menu_item tight" href="?l=portuguese" onclick="ChangeLanguage( 'portuguese' ); return false;">Português (Portuguese)</a>
																																<a class="popup_menu_item tight" href="?l=brazilian" onclick="ChangeLanguage( 'brazilian' ); return false;">Português - Brasil (Portuguese - Brazil)</a>
																																<a class="popup_menu_item tight" href="?l=romanian" onclick="ChangeLanguage( 'romanian' ); return false;">Română (Romanian)</a>
																																<a class="popup_menu_item tight" href="?l=russian" onclick="ChangeLanguage( 'russian' ); return false;">Русский (Russian)</a>
																																<a class="popup_menu_item tight" href="?l=finnish" onclick="ChangeLanguage( 'finnish' ); return false;">Suomi (Finnish)</a>
																																<a class="popup_menu_item tight" href="?l=swedish" onclick="ChangeLanguage( 'swedish' ); return false;">Svenska (Swedish)</a>
																																<a class="popup_menu_item tight" href="?l=turkish" onclick="ChangeLanguage( 'turkish' ); return false;">Türkçe (Turkish)</a>
																																<a class="popup_menu_item tight" href="?l=vietnamese" onclick="ChangeLanguage( 'vietnamese' ); return false;">Tiếng Việt (Vietnamese)</a>
																																<a class="popup_menu_item tight" href="?l=ukrainian" onclick="ChangeLanguage( 'ukrainian' ); return false;">Українська (Ukrainian)</a>
																												<a class="popup_menu_item tight" href="http://translation.steampowered.com" target="_blank">Help us translate Steam</a>
								</div>
							</div>
															<a class="popup_menu_item" href="https://steamcommunity.com/profiles/76561197964552011/">View profile</a>
													</div>
					</div>
					<script type="text/javascript">
						RegisterFlyout( 'account_language_pulldown', 'language_dropdown', 'leftsubmenu', 'bottomsubmenu', true );
					</script>
												</div>
							<a href="https://steamcommunity.com/profiles/76561197964552011/" class="user_avatar playerAvatar offline">
					<img src="https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/fe/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb.jpg">
				</a>
					</div>
			</div>
</div>
<script type="text/javascript">
	g_sessionID = "1d9e29bbb3a71dcaecc03229";
	g_steamID = "76561197964552011";
	g_SNR = '2_100300_badges_';

	// We always want to have the timezone cookie set for PHP to use
	setTimezoneCookies();

	$J( function() {

		InitMiniprofileHovers();
		InitEmoticonHovers();


				g_CommunityPreferences = {"hide_adult_content_violence":1,"hide_adult_content_sex":1,"parenthesize_nicknames":0,"timestamp_updated":0};
				ApplyAdultContentPreferences();
	});

	$J( function() { InitEconomyHovers( "https:\/\/steamcommunity-a.akamaihd.net\/public\/css\/skin_1\/economy.css?v=Puk7JmfocgYh&l=english", "https:\/\/steamcommunity-a.akamaihd.net\/public\/javascript\/economy_common.js?v=tsXdRVB0yEaR&l=english", "https:\/\/steamcommunity-a.akamaihd.net\/public\/javascript\/economy.js?v=2LpiaJiQVjHu&l=english" );});</script>

		<div class="responsive_page_template_content">

			<script type="text/javascript">
	var g_strProfileURL = 'https://steamcommunity.com/profiles/76561197964552011';
</script>
<div class="pagecontent">
	<div class="profile_small_header_bg">
	<div class="profile_small_header_texture">

		<div class="profile_small_header_text">
			<span class="profile_small_header_name"><a class="whiteLink" href="https://steamcommunity.com/profiles/76561197964552011">BotFarmer[1]</a></span>
							<span class="profile_small_header_arrow">&raquo;</span>
				<a class="whiteLink"  href="https://steamcommunity.com/profiles/76561197964552011/badges/"><span class="profile_small_header_location">Badges</span></a>
			
					</div>
		<a href="https://steamcommunity.com/profiles/76561197964552011">
			<div class="profile_small_header_avatar">
				<div class="playerAvatar medium offline">
					<img src="https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/fe/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_medium.jpg">
				</div>
			</div>
		</a>
			</div>
</div>
	<div class="maincontent">

					<div class="profile_xp_block">
				<div class="profile_xp_block_left">
					<span class="profile_xp_block_level">Level <span class="friendPlayerLevel lvl_0"><span class="friendPlayerLevelNum">9</span></span></span>
					<span class="profile_xp_block_xp">XP 968</span>
				</div>
									<div class="profile_xp_block_right">How do I earn badges and increase my Steam Level?  <a class="whiteLink" href="https://steamcommunity.com/tradingcards/faq" target="_blank" rel="noreferrer">Read the FAQ</a></div>
								<div class="profile_xp_block_mid">
					<div class="profile_xp_block_remaining">32 XP to reach Level 10</div>
					<div class="profile_xp_block_remaining_bar">
						<div class="profile_xp_block_remaining_bar_progress" style="width: 68%"></div>
					</div>
				</div>
				<div style="clear: both"></div>
			</div>
		
					<div class="badge_details_set_favorite">
				<div class="btn_grey_black btn_small_thin" onclick="ShowBoosterEligibility();">
					<span>View my booster pack eligibility</span>
				</div>
									<a class="btn_grey_black btn_small_thin" href="https://steamcommunity.com/tradingcards/boostercreator/">
						<span>Booster Pack Creator</span>
					</a>
							</div>
		
		<div class="profile_badges_header">
			<div class="profile_badges_sortoptions">
				<span>Sort by</span>
									<a class="badge_sort_option whiteLink active" href="https://steamcommunity.com/profiles/76561197964552011/badges/?sort=p">
						In Progress					</a>
									<a class="badge_sort_option whiteLink " href="https://steamcommunity.com/profiles/76561197964552011/badges/?sort=c">
						Completed					</a>
									<a class="badge_sort_option whiteLink " href="https://steamcommunity.com/profiles/76561197964552011/badges/?sort=a">
						A - Z					</a>
									<a class="badge_sort_option whiteLink " href="https://steamcommunity.com/profiles/76561197964552011/badges/?sort=r">
						Rarity					</a>
							</div>
			<div class="profile_badges_header_title">
				Badges			</div>
		</div>

		
		<div class="badges_sheet">
							<div id="image_group_scroll_badge_images_gamebadge_582430_1_0"></div><script type="text/javascript">$J( function() { LoadImageGroupOnScroll( 'image_group_scroll_badge_images_gamebadge_582430_1_0', 'badge_images_gamebadge_582430_1_0' ); } );</script>				<div class="badge_row is_link">
					<a class="badge_row_overlay" href="https://steamcommunity.com/profiles/76561197964552011/gamecards/582430/"></a>
					<div class="badge_row_inner">
						<div class="badge_title_row">
															<div class="badge_title_stats">
																			<div class="badge_title_playgame">
											<a class="btn_green_white_innerfade btn_small_thin" href="steam://run/582430">
												<span>PLAY</span>
											</a>
										</div>
																		<div class="badge_title_stats_content">
										<div class="badge_title_stats_playtime">
											&nbsp;
																							4.1 hrs on record																					</div>
										<div class="badge_title_stats_drops">
																																				<span class="progress_info_bold">1 card drop remaining</span>
													<span class="how_to_get_card_drops_ctn">
														&nbsp;<a class="whiteLink how_to_get_card_drops" href="javascript:ShowCardDropInfo( &quot;Jumping Tank&quot;, 'card_drop_info_gamebadge_582430_1_0' );">How do I earn card drops?</a>
													</span>
													<div class="card_drop_info_dialog" id="card_drop_info_gamebadge_582430_1_0" style="display: none;">
	<div class="card_drop_info_header">Card drops earned: 4</div>
	<div class="card_drop_info_body">
									<div>Drops earned by purchasing: 4</div>
					</div>

	<div class="card_drop_info_header">
		Card drops received: 3	</div>
	<div class="card_drop_info_body">
		You can get 1 more trading card by playing Jumping Tank.	</div>
	<div class="card_drop_info_subarea">
		<div class="card_drop_info_breakafter">How can I earn more drops?</div>

				<div class="card_drop_info_header disabled">
			You are not currently eligible for a booster pack		</div>
		<div class="">
			Once you have received all of your card drops, you become eligible for a booster pack containing 3 additional cards.  Booster packs are granted randomly to eligible users as more badges are crafted by members of the community.  Make sure you log in to Steam each week to maintain eligibility.		</div>
	</div>
</div>																																	</div>
									</div>
								</div>
								<div class="badge_title">
									Jumping Tank																		&nbsp;<span class="badge_view_details">View details</span>
								</div>
													</div>
						<div class="badge_title_rule"></div>
						<div class="badge_content">
															<div class="badge_progress_info">
																			3 of 7 cards collected																	</div>
							
							<div class="badge_current">
																	<div class="badge_empty">
										<div class="badge_empty_circle"></div>
										<div class="badge_empty_right">
											<div class="badge_empty_name">Soldier</div>
											<div class="badge_empty_name">100 XP</div>
											<div style="clear: both"></div>
										</div>
									</div>
																							</div>

																								<div class="badge_progress_tasks badge_cards">
																															<div class="badge_progress_card_ctn">
												<div class="badge_progress_card owned"><img src="https://steamcommunity-a.akamaihd.net/public/shared/images/trans.gif" id="delayedimage_badge_images_gamebadge_582430_1_0_0"></div>
											</div>
																					<div class="badge_progress_card_ctn">
												<div class="badge_progress_card owned"><img src="https://steamcommunity-a.akamaihd.net/public/shared/images/trans.gif" id="delayedimage_badge_images_gamebadge_582430_1_0_1"></div>
											</div>
																					<div class="badge_progress_card_ctn">
												<div class="badge_progress_card owned"><img src="https://steamcommunity-a.akamaihd.net/public/shared/images/trans.gif" id="delayedimage_badge_images_gamebadge_582430_1_0_2"></div>
											</div>
																															<div class="badge_progress_card_ctn">
												<div class="badge_progress_card unowned"><img src="https://steamcommunity-a.akamaihd.net/public/shared/images/trans.gif" id="delayedimage_badge_images_gamebadge_582430_1_0_3"></div>
											</div>
																					<div class="badge_progress_card_ctn">
												<div class="badge_progress_card unowned"><img src="https://steamcommunity-a.akamaihd.net/public/shared/images/trans.gif" id="delayedimage_badge_images_gamebadge_582430_1_0_4"></div>
											</div>
																			</div>
															
							<div style="clear: both;"></div>
						</div>
					</div>
				</div>
							<div id="image_group_scroll_badge_images_gamebadge_285800_1_0"></div><script type="text/javascript">$J( function() { LoadImageGroupOnScroll( 'image_group_scroll_badge_images_gamebadge_285800_1_0', 'badge_images_gamebadge_285800_1_0' ); } );</script>				<div class="badge_row is_link">
					<a class="badge_row_overlay" href="https://steamcommunity.com/profiles/76561197964552011/gamecards/285800/"></a>
					<div class="badge_row_inner">
						<div class="badge_title_row">
															<div class="badge_title_stats">
																		<div class="badge_title_stats_content">
										<div class="badge_title_stats_playtime">
											&nbsp;
																							3.8 hrs on record																					</div>
										<div class="badge_title_stats_drops">
																																				<span class="progress_info_bold">No card drops remaining</span>
													<span class="how_to_get_card_drops_ctn">
														&nbsp;<a class="whiteLink how_to_get_card_drops" href="javascript:ShowCardDropInfo( &quot;Braveland&quot;, 'card_drop_info_gamebadge_285800_1_0' );">How do I earn card drops?</a>
													</span>
													<div class="card_drop_info_dialog" id="card_drop_info_gamebadge_285800_1_0" style="display: none;">
	<div class="card_drop_info_header">Card drops earned: 3</div>
	<div class="card_drop_info_body">
									<div>Drops earned by purchasing: 3</div>
					</div>

	<div class="card_drop_info_header">
		Card drops received: 3	</div>
	<div class="card_drop_info_body">
		You don't have any more drops remaining for Braveland.	</div>
	<div class="card_drop_info_subarea">
		<div class="card_drop_info_breakafter">How can I earn more drops?</div>

				<div class="card_drop_info_header ">
			You are now eligible for a booster pack		</div>
		<div class="">
			Once you have received all of your card drops, you become eligible for a booster pack containing 3 additional cards.  Booster packs are granted randomly to eligible users as more badges are crafted by members of the community.  Make sure you log in to Steam each week to maintain eligibility.		</div>
	</div>
</div>																																	</div>
									</div>
								</div>
								<div class="badge_title">
									Braveland																		&nbsp;<span class="badge_view_details">View details</span>
								</div>
													</div>
						<div class="badge_title_rule"></div>
						<div class="badge_content">
															<div class="badge_progress_info">
																			2 of 5 cards collected																	</div>
							
							<div class="badge_current">
																	<div class="badge_empty">
										<div class="badge_empty_circle"></div>
										<div class="badge_empty_right">
											<div class="badge_empty_name">Archer</div>
											<div class="badge_empty_name">100 XP</div>
											<div style="clear: both"></div>
										</div>
									</div>
																							</div>

																								<div class="badge_progress_tasks badge_cards">
																															<div class="badge_progress_card_ctn">
												<div class="badge_progress_card owned"><img src="https://steamcommunity-a.akamaihd.net/public/shared/images/trans.gif" id="delayedimage_badge_images_gamebadge_285800_1_0_0"></div>
											</div>
																					<div class="badge_progress_card_ctn">
												<div class="badge_progress_card owned"><img src="https://steamcommunity-a.akamaihd.net/public/shared/images/trans.gif" id="delayedimage_badge_images_gamebadge_285800_1_0_1"></div>
											</div>
																															<div class="badge_progress_card_ctn">
												<div class="badge_progress_card unowned"><img src="https://steamcommunity-a.akamaihd.net/public/shared/images/trans.gif" id="delayedimage_badge_images_gamebadge_285800_1_0_2"></div>
											</div>
																					<div class="badge_progress_card_ctn">
												<div class="badge_progress_card unowned"><img src="https://steamcommunity-a.akamaihd.net/public/shared/images/trans.gif" id="delayedimage_badge_images_gamebadge_285800_1_0_3"></div>
											</div>
																					<div class="badge_progress_card_ctn">
												<div class="badge_progress_card unowned"><img src="https://steamcommunity-a.akamaihd.net/public/shared/images/trans.gif" id="delayedimage_badge_images_gamebadge_285800_1_0_4"></div>
											</div>
																			</div>
															
							<div style="clear: both;"></div>
						</div>
					</div>
				</div>
							<div id="image_group_scroll_badge_images_gamebadge_292910_1_0"></div><script type="text/javascript">$J( function() { LoadImageGroupOnScroll( 'image_group_scroll_badge_images_gamebadge_292910_1_0', 'badge_images_gamebadge_292910_1_0' ); } );</script>				<div class="badge_row is_link">
					<a class="badge_row_overlay" href="https://steamcommunity.com/profiles/76561197964552011/gamecards/292910/"></a>
					<div class="badge_row_inner">
						<div class="badge_title_row">
															<div class="badge_title_stats">
																			<div class="badge_title_playgame">
											<a class="btn_green_white_innerfade btn_small_thin" href="steam://run/292910">
												<span>PLAY</span>
											</a>
										</div>
																		<div class="badge_title_stats_content">
										<div class="badge_title_stats_playtime">
											&nbsp;
																							4.3 hrs on record																					</div>
										<div class="badge_title_stats_drops">
																																				<span class="progress_info_bold">1 card drop remaining</span>
													<span class="how_to_get_card_drops_ctn">
														&nbsp;<a class="whiteLink how_to_get_card_drops" href="javascript:ShowCardDropInfo( &quot;Deponia: The Complete Journey&quot;, 'card_drop_info_gamebadge_292910_1_0' );">How do I earn card drops?</a>
													</span>
													<div class="card_drop_info_dialog" id="card_drop_info_gamebadge_292910_1_0" style="display: none;">
	<div class="card_drop_info_header">Card drops earned: 4</div>
	<div class="card_drop_info_body">
									<div>Drops earned by purchasing: 4</div>
					</div>

	<div class="card_drop_info_header">
		Card drops received: 3	</div>
	<div class="card_drop_info_body">
		You can get 1 more trading card by playing Deponia: The Complete Journey.	</div>
	<div class="card_drop_info_subarea">
		<div class="card_drop_info_breakafter">How can I earn more drops?</div>

				<div class="card_drop_info_header disabled">
			You are not currently eligible for a booster pack		</div>
		<div class="">
			Once you have received all of your card drops, you become eligible for a booster pack containing 3 additional cards.  Booster packs are granted randomly to eligible users as more badges are crafted by members of the community.  Make sure you log in to Steam each week to maintain eligibility.		</div>
	</div>
</div>																																	</div>
									</div>
								</div>
								<div class="badge_title">
									Deponia: The Complete Journey																		&nbsp;<span class="badge_view_details">View details</span>
								</div>
													</div>
						<div class="badge_title_rule"></div>
						<div class="badge_content">
															<div class="badge_progress_info">
																			3 of 8 cards collected																	</div>
							
							<div class="badge_current">
																	<div class="badge_empty">
										<div class="badge_empty_circle"></div>
										<div class="badge_empty_right">
											<div class="badge_empty_name">Sewer Resident</div>
											<div class="badge_empty_name">100 XP</div>
											<div style="clear: both"></div>
										</div>
									</div>
																							</div>

																								<div class="badge_progress_tasks badge_cards">
																															<div class="badge_progress_card_ctn">
												<div class="badge_progress_card owned"><img src="https://steamcommunity-a.akamaihd.net/public/shared/images/trans.gif" id="delayedimage_badge_images_gamebadge_292910_1_0_0"></div>
											</div>
																					<div class="badge_progress_card_ctn">
												<div class="badge_progress_card owned"><img src="https://steamcommunity-a.akamaihd.net/public/shared/images/trans.gif" id="delayedimage_badge_images_gamebadge_292910_1_0_1"></div>
											</div>
																					<div class="badge_progress_card_ctn">
												<div class="badge_progress_card owned"><img src="https://steamcommunity-a.akamaihd.net/public/shared/images/trans.gif" id="delayedimage_badge_images_gamebadge_292910_1_0_2"></div>
											</div>
																															<div class="badge_progress_card_ctn">
												<div class="badge_progress_card unowned"><img src="https://steamcommunity-a.akamaihd.net/public/shared/images/trans.gif" id="delayedimage_badge_images_gamebadge_292910_1_0_3"></div>
											</div>
																					<div class="badge_progress_card_ctn">
												<div class="badge_progress_card unowned"><img src="https://steamcommunity-a.akamaihd.net/public/shared/images/trans.gif" id="delayedimage_badge_images_gamebadge_292910_1_0_4"></div>
											</div>
																			</div>
															
							<div style="clear: both;"></div>
						</div>
					</div>
				</div>
							<div id="image_group_scroll_badge_images_gamebadge_220_1_0"></div><script type="text/javascript">$J( function() { LoadImageGroupOnScroll( 'image_group_scroll_badge_images_gamebadge_220_1_0', 'badge_images_gamebadge_220_1_0' ); } );</script>				<div class="badge_row is_link">
					<a class="badge_row_overlay" href="https://steamcommunity.com/profiles/76561197964552011/gamecards/220/"></a>
					<div class="badge_row_inner">
						<div class="badge_title_row">
															<div class="badge_title_stats">
																		<div class="badge_title_stats_content">
										<div class="badge_title_stats_playtime">
											&nbsp;
																							5.5 hrs on record																					</div>
										<div class="badge_title_stats_drops">
																																				<span class="progress_info_bold">No card drops remaining</span>
													<span class="how_to_get_card_drops_ctn">
														&nbsp;<a class="whiteLink how_to_get_card_drops" href="javascript:ShowCardDropInfo( &quot;Half-Life 2&quot;, 'card_drop_info_gamebadge_220_1_0' );">How do I earn card drops?</a>
													</span>
													<div class="card_drop_info_dialog" id="card_drop_info_gamebadge_220_1_0" style="display: none;">
	<div class="card_drop_info_header">Card drops earned: 4</div>
	<div class="card_drop_info_body">
									<div>Drops earned by purchasing: 4</div>
					</div>

	<div class="card_drop_info_header">
		Card drops received: 4	</div>
	<div class="card_drop_info_body">
		You don't have any more drops remaining for Half-Life 2.	</div>
	<div class="card_drop_info_subarea">
		<div class="card_drop_info_breakafter">How can I earn more drops?</div>

				<div class="card_drop_info_header ">
			You are now eligible for a booster pack		</div>
		<div class="">
			Once you have received all of your card drops, you become eligible for a booster pack containing 3 additional cards.  Booster packs are granted randomly to eligible users as more badges are crafted by members of the community.  Make sure you log in to Steam each week to maintain eligibility.		</div>
	</div>
</div>																																	</div>
									</div>
								</div>
								<div class="badge_title">
									Half-Life 2																		&nbsp;<span class="badge_view_details">View details</span>
								</div>
													</div>
						<div class="badge_title_rule"></div>
						<div class="badge_content">
															<div class="badge_progress_info">
																			2 of 8 cards collected																	</div>
							
							<div class="badge_current">
																	<div class="badge_empty">
										<div class="badge_empty_circle"></div>
										<div class="badge_empty_right">
											<div class="badge_empty_name">City 17</div>
											<div class="badge_empty_name">100 XP</div>
											<div style="clear: both"></div>
										</div>
									</div>
																							</div>

																								<div class="badge_progress_tasks badge_cards">
																															<div class="badge_progress_card_ctn">
												<div class="badge_progress_card owned"><img src="https://steamcommunity-a.akamaihd.net/public/shared/images/trans.gif" id="delayedimage_badge_images_gamebadge_220_1_0_0"></div>
											</div>
																					<div class="badge_progress_card_ctn">
												<div class="badge_progress_card owned"><img src="https://steamcommunity-a.akamaihd.net/public/shared/images/trans.gif" id="delayedimage_badge_images_gamebadge_220_1_0_1"></div>
											</div>
																															<div class="badge_progress_card_ctn">
												<div class="badge_progress_card unowned"><img src="https://steamcommunity-a.akamaihd.net/public/shared/images/trans.gif" id="delayedimage_badge_images_gamebadge_220_1_0_2"></div>
											</div>
																					<div class="badge_progress_card_ctn">
												<div class="badge_progress_card unowned"><img src="https://steamcommunity-a.akamaihd.net/public/shared/images/trans.gif" id="delayedimage_badge_images_gamebadge_220_1_0_3"></div>
											</div>
																					<div class="badge_progress_card_ctn">
												<div class="badge_progress_card unowned"><img src="https://steamcommunity-a.akamaihd.net/public/shared/images/trans.gif" id="delayedimage_badge_images_gamebadge_220_1_0_4"></div>
											</div>
																			</div>
															
							<div style="clear: both;"></div>
						</div>
					</div>
				</div>
							<div id="image_group_scroll_badge_images_badge_2"></div><script type="text/javascript">$J( function() { LoadImageGroupOnScroll( 'image_group_scroll_badge_images_badge_2', 'badge_images_badge_2' ); } );</script>				<div class="badge_row is_link">
					<a class="badge_row_overlay" href="https://steamcommunity.com/profiles/76561197964552011/badges/2"></a>
					<div class="badge_row_inner">
						<div class="badge_title_row">
															<div class="badge_title">
									Pillar of Community									&nbsp;<span class="badge_view_details">View details</span>
								</div>
													</div>
						<div class="badge_title_rule"></div>
						<div class="badge_content">
															<div class="badge_progress_info">
									22 tasks remaining<br>
									<span class="progress_info_bold">
										6 of 28 tasks completed									</span>
								</div>
							
							<div class="badge_current">
																	<div class="badge_empty">
										<div class="badge_empty_circle"></div>
										<div class="badge_empty_right">
											<div class="badge_empty_name">Pillar of Community</div>
											<div class="badge_empty_name">0 XP</div>
											<div style="clear: both"></div>
										</div>
									</div>
																									<div style="clear: left;"></div>
									<div class="badge_description">
										6 of 28 tasks completed. Complete 7 more Steam Community tasks to earn the Level 1 badge.									</div>
															</div>

															<div class="badge_progress_tasks">
																			<div class="badge_progress_task">
											<img class="quest_icon" src="https://steamcommunity-a.akamaihd.net/public/images/badges/02_community/SetupSteamGuard_on.png?v=4" data-tooltip-html="&lt;b&gt;Enable Steam Guard on your Steam account&lt;/b&gt;&lt;br&gt;Use the Steam Settings dialog to enable Steam Guard.">
										</div>
																			<div class="badge_progress_task">
											<img class="quest_icon" src="https://steamcommunity-a.akamaihd.net/public/images/badges/02_community/AddPhoneToAccount_off.png?v=4" data-tooltip-html="&lt;b&gt;Add a phone number to your account.&lt;/b&gt;&lt;br&gt;Visit your account details page and add an phone number to your account, in case you ever lose access to your login credentials.">
										</div>
																			<div class="badge_progress_task">
											<img class="quest_icon" src="https://steamcommunity-a.akamaihd.net/public/images/badges/02_community/AddTwoFactorToAccount_off.png?v=4" data-tooltip-html="&lt;b&gt;Use the Steam Mobile App for two-factor authentication&lt;/b&gt;&lt;br&gt;Download the Steam Mobile App on your iOS or Android device, and use it to log into your Steam Account.">
										</div>
																			<div class="badge_progress_task">
											<img class="quest_icon" src="https://steamcommunity-a.akamaihd.net/public/images/badges/02_community/ViewBroadcast_off.png?v=4" data-tooltip-html="&lt;b&gt;View a broadcast&lt;/b&gt;&lt;br&gt;Visit the broadcasts page on the Steam Community and watch someone else play!.">
										</div>
																			<div class="badge_progress_task">
											<img class="quest_icon" src="https://steamcommunity-a.akamaihd.net/public/images/badges/02_community/UseDiscoveryQueue_off.png?v=4" data-tooltip-html="&lt;b&gt;Use the Store Discovery Queue&lt;/b&gt;&lt;br&gt;Visit the Steam Store and complete a discovery queue.">
										</div>
																			<div class="badge_progress_task">
											<img class="quest_icon" src="https://steamcommunity-a.akamaihd.net/public/images/badges/02_community/AddItemToWishlist_off.png?v=4" data-tooltip-html="&lt;b&gt;Add a game to your wishlist&lt;/b&gt;&lt;br&gt;Browse games on the &amp;lt;a href=&amp;quot;http://store.steampowered.com/&amp;quot;&amp;gt;Steam Store&amp;lt;/a&amp;gt; and select one to add to your wishlist.">
										</div>
																			<div class="badge_progress_task">
											<img class="quest_icon" src="https://steamcommunity-a.akamaihd.net/public/images/badges/02_community/AddFriendToFriendsList_on.png?v=4" data-tooltip-html="&lt;b&gt;Add a friend to your friends list&lt;/b&gt;&lt;br&gt;Add a new friend to your friends list.">
										</div>
																			<div class="badge_progress_task">
											<img class="quest_icon" src="https://steamcommunity-a.akamaihd.net/public/images/badges/02_community/PlayGame_on.png?v=4" data-tooltip-html="&lt;b&gt;Play a game&lt;/b&gt;&lt;br&gt;Launch any game from your games list in the Steam Client.">
										</div>
																			<div class="badge_progress_task">
											<img class="quest_icon" src="https://steamcommunity-a.akamaihd.net/public/images/badges/02_community/RecommendGame_off.png?v=4" data-tooltip-html="&lt;b&gt;Review a game&lt;/b&gt;&lt;br&gt;Choose a new game from your &amp;lt;a href=&amp;quot;https://steamcommunity.com/profiles/76561197964552011/games/&amp;quot;&amp;gt;games list&amp;lt;/a&amp;gt; to review.">
										</div>
																			<div class="badge_progress_task">
											<img class="quest_icon" src="https://steamcommunity-a.akamaihd.net/public/images/badges/02_community/PostScreenshot_off.png?v=4" data-tooltip-html="&lt;b&gt;Post a screenshot&lt;/b&gt;&lt;br&gt;Press your screenshot key (usually F12) while in a game to take a new screenshot, and then publish it to your friends.">
										</div>
																			<div class="badge_progress_task">
											<img class="quest_icon" src="https://steamcommunity-a.akamaihd.net/public/images/badges/02_community/PostVideo_off.png?v=4" data-tooltip-html="&lt;b&gt;Post a video&lt;/b&gt;&lt;br&gt;Visit your &amp;lt;a href=&amp;quot;https://steamcommunity.com/profiles/76561197964552011/videos/&amp;quot;&amp;gt;videos page&amp;lt;/a&amp;gt; to pick a new video to share.">
										</div>
																			<div class="badge_progress_task">
											<img class="quest_icon" src="https://steamcommunity-a.akamaihd.net/public/images/badges/02_community/RateWorkshopItem_off.png?v=4" data-tooltip-html="&lt;b&gt;Rate an item on the Workshop&lt;/b&gt;&lt;br&gt;Visit the &amp;lt;a href=&amp;quot;https://steamcommunity.com/workshop/&amp;quot;&amp;gt;Steam Workshop&amp;lt;/a&amp;gt; and choose an item to thumbs up.">
										</div>
																			<div class="badge_progress_task">
											<img class="quest_icon" src="https://steamcommunity-a.akamaihd.net/public/images/badges/02_community/SubscribeToWorkshopItem_off.png?v=4" data-tooltip-html="&lt;b&gt;Subscribe to an item in the Steam Workshop&lt;/b&gt;&lt;br&gt;Visit the &amp;lt;a href=&amp;quot;https://steamcommunity.com/workshop/&amp;quot;&amp;gt;Steam Workshop&amp;lt;/a&amp;gt; and choose an item to subscribe to.">
										</div>
																			<div class="badge_progress_task">
											<img class="quest_icon" src="https://steamcommunity-a.akamaihd.net/public/images/badges/02_community/ViewGuideInOverlay_off.png?v=4" data-tooltip-html="&lt;b&gt;View a guide in the Steam Overlay&lt;/b&gt;&lt;br&gt;While in game, open the Steam Overlay and browse the available game guides.">
										</div>
																			<div class="badge_progress_task">
											<img class="quest_icon" src="https://steamcommunity-a.akamaihd.net/public/images/badges/02_community/SetupCommunityAvatar_on.png?v=4" data-tooltip-html="&lt;b&gt;Set an avatar on your Community profile&lt;/b&gt;&lt;br&gt;Edit your &amp;lt;a href=&amp;quot;https://steamcommunity.com/profiles/76561197964552011/edit/&amp;quot;&amp;gt;community profile&amp;lt;/a&amp;gt; to set an avatar.">
										</div>
																			<div class="badge_progress_task">
											<img class="quest_icon" src="https://steamcommunity-a.akamaihd.net/public/images/badges/02_community/SetupCommunityRealName_off.png?v=4" data-tooltip-html="&lt;b&gt;Set your real name on your Community profile&lt;/b&gt;&lt;br&gt;Edit your &amp;lt;a href=&amp;quot;https://steamcommunity.com/profiles/76561197964552011/edit/&amp;quot;&amp;gt;community profile&amp;lt;/a&amp;gt; to set a real name. Any name will work, but setting your real name will help your friends know who you are.">
										</div>
																			<div class="badge_progress_task">
											<img class="quest_icon" src="https://steamcommunity-a.akamaihd.net/public/images/badges/02_community/SetProfileBackground_on.png?v=4" data-tooltip-html="&lt;b&gt;Set a profile background&lt;/b&gt;&lt;br&gt;Profile backgrounds are dropped during trading card crafting and are tradable.">
										</div>
																			<div class="badge_progress_task">
											<img class="quest_icon" src="https://steamcommunity-a.akamaihd.net/public/images/badges/02_community/JoinGroup_off.png?v=4" data-tooltip-html="&lt;b&gt;Join a group&lt;/b&gt;&lt;br&gt;Browse some existing &amp;lt;a href=&amp;quot;https://steamcommunity.com/actions/GroupList/&amp;quot;&amp;gt;Steam Groups&amp;lt;/a&amp;gt; and join up.">
										</div>
																			<div class="badge_progress_task">
											<img class="quest_icon" src="https://steamcommunity-a.akamaihd.net/public/images/badges/02_community/PostCommentOnFriendsPage_off.png?v=4" data-tooltip-html="&lt;b&gt;Comment on a friend's profile&lt;/b&gt;&lt;br&gt;Visit a &amp;lt;a href=&amp;quot;https://steamcommunity.com/profiles/76561197964552011/friends/&amp;quot;&amp;gt;friend's&amp;lt;/a&amp;gt; profile page and add a new comment.">
										</div>
																			<div class="badge_progress_task">
											<img class="quest_icon" src="https://steamcommunity-a.akamaihd.net/public/images/badges/02_community/RateUpContentInActivityFeed_off.png?v=4" data-tooltip-html="&lt;b&gt;Rate up content in your Activity Feed&lt;/b&gt;&lt;br&gt;Visit your &amp;lt;a href=&amp;quot;https://steamcommunity.com/profiles/76561197964552011/home/&amp;quot;&amp;gt;Activity Feed&amp;lt;/a&amp;gt; and rate up any content from a friend or content author you follow.">
										</div>
																			<div class="badge_progress_task">
											<img class="quest_icon" src="https://steamcommunity-a.akamaihd.net/public/images/badges/02_community/PostStatusToFriends_off.png?v=4" data-tooltip-html="&lt;b&gt;Post a status to your friends&lt;/b&gt;&lt;br&gt;Visit your &amp;lt;a href=&amp;quot;https://steamcommunity.com/profiles/76561197964552011/home/&amp;quot;&amp;gt;Activity Feed&amp;lt;/a&amp;gt; to post a status.">
										</div>
																			<div class="badge_progress_task">
											<img class="quest_icon" src="https://steamcommunity-a.akamaihd.net/public/images/badges/02_community/PostCommentOnFriendsScreenshot_off.png?v=4" data-tooltip-html="&lt;b&gt;Comment on a friend's screenshot&lt;/b&gt;&lt;br&gt;Visit your &amp;lt;a href=&amp;quot;https://steamcommunity.com/profiles/76561197964552011/friends/&amp;quot;&amp;gt;friend's&amp;lt;/a&amp;gt; screenshot pages and add a new comment.">
										</div>
																			<div class="badge_progress_task">
											<img class="quest_icon" src="https://steamcommunity-a.akamaihd.net/public/images/badges/02_community/CraftGameBadge_off.png?v=4" data-tooltip-html="&lt;b&gt;Craft a game badge&lt;/b&gt;&lt;br&gt;Complete a set of trading cards and craft them into a game badge">
										</div>
																			<div class="badge_progress_task">
											<img class="quest_icon" src="https://steamcommunity-a.akamaihd.net/public/images/badges/02_community/FeatureBadgeOnProfile_on.png?v=4" data-tooltip-html="&lt;b&gt;Feature a badge on your profile&lt;/b&gt;&lt;br&gt;Visit your &amp;lt;a href=&amp;quot;https://steamcommunity.com/profiles/76561197964552011/badges/&amp;quot;&amp;gt;Badges&amp;lt;/a&amp;gt; page and select your favorite.">
										</div>
																			<div class="badge_progress_task">
											<img class="quest_icon" src="https://steamcommunity-a.akamaihd.net/public/images/badges/02_community/UseEmoticonInChat_off.png?v=4" data-tooltip-html="&lt;b&gt;Use a Steam Emoticon in chat&lt;/b&gt;&lt;br&gt;:yay: Find and use a Steam Emoticon in chat.  Emoticons are dropped when crafting trading cards and are tradable.">
										</div>
																			<div class="badge_progress_task">
											<img class="quest_icon" src="https://steamcommunity-a.akamaihd.net/public/images/badges/02_community/SearchInDiscussions_off.png?v=4" data-tooltip-html="&lt;b&gt;Search the Steam Discussions&lt;/b&gt;&lt;br&gt;Use the &amp;lt;a href=&amp;quot;https://steamcommunity.com/discussions/&amp;quot;&amp;gt;discussions search&amp;lt;/a&amp;gt; to find a topic that interests you.">
										</div>
																			<div class="badge_progress_task">
											<img class="quest_icon" src="https://steamcommunity-a.akamaihd.net/public/images/badges/02_community/BuyOrSellOnMarket_off.png?v=4" data-tooltip-html="&lt;b&gt;Try out the Community Market&lt;/b&gt;&lt;br&gt;Buy or Sell an item from your &amp;lt;a href=&amp;quot;https://steamcommunity.com/profiles/76561197964552011/inventory/&amp;quot;&amp;gt;Inventory&amp;lt;/a&amp;gt; on the &amp;lt;a href=&amp;quot;https://steamcommunity.com/market/&amp;quot;&amp;gt;Community Market&amp;lt;/a&amp;gt;.">
										</div>
																			<div class="badge_progress_task">
											<img class="quest_icon" src="https://steamcommunity-a.akamaihd.net/public/images/badges/02_community/Trade_off.png?v=4" data-tooltip-html="&lt;b&gt;Make a trade&lt;/b&gt;&lt;br&gt;Use Steam Trading to make a trade.">
										</div>
																	</div>
							
							<div style="clear: both;"></div>
						</div>
					</div>
				</div>
							<div id="image_group_scroll_badge_images_badge_13"></div><script type="text/javascript">$J( function() { LoadImageGroupOnScroll( 'image_group_scroll_badge_images_badge_13', 'badge_images_badge_13' ); } );</script>				<div class="badge_row is_link">
					<a class="badge_row_overlay" href="https://steamcommunity.com/profiles/76561197964552011/badges/13"></a>
					<div class="badge_row_inner">
						<div class="badge_title_row">
															<div class="badge_title">
									Sharp-Eyed Stockpiler									&nbsp;<span class="badge_view_details">View details</span>
								</div>
													</div>
						<div class="badge_title_rule"></div>
						<div class="badge_content">
							
							<div class="badge_current">
																	<div class="badge_info">
										<div class="badge_info_image">
											<img src="https://steamcommunity-a.akamaihd.net/public/shared/images/trans.gif" id="delayedimage_badge_images_badge_13_0" class="badge_icon">
										</div>
										<div class="badge_info_description">
											<div class="badge_info_title">Sharp-Eyed Stockpiler</div>
											<div>
																								218 XP											</div>
											<div class="badge_info_unlocked">
												Unlocked Jul 30 @ 12:01pm											</div>
										</div>
									</div>
																							</div>

							
							<div style="clear: both;"></div>
						</div>
					</div>
				</div>
							<div id="image_group_scroll_badge_images_badge_1"></div><script type="text/javascript">$J( function() { LoadImageGroupOnScroll( 'image_group_scroll_badge_images_badge_1', 'badge_images_badge_1' ); } );</script>				<div class="badge_row is_link">
					<a class="badge_row_overlay" href="https://steamcommunity.com/profiles/76561197964552011/badges/1"></a>
					<div class="badge_row_inner">
						<div class="badge_title_row">
															<div class="badge_title">
									Years of Service									&nbsp;<span class="badge_view_details">View details</span>
								</div>
													</div>
						<div class="badge_title_rule"></div>
						<div class="badge_content">
							
							<div class="badge_current">
																	<div class="badge_info">
										<div class="badge_info_image">
											<img src="https://steamcommunity-a.akamaihd.net/public/shared/images/trans.gif" id="delayedimage_badge_images_badge_1_0" class="badge_icon">
										</div>
										<div class="badge_info_description">
											<div class="badge_info_title">Years of Service</div>
											<div>
																								750 XP											</div>
											<div class="badge_info_unlocked">
												Unlocked Feb 18 @ 2:17pm											</div>
										</div>
									</div>
																							</div>

							
							<div style="clear: both;"></div>
						</div>
					</div>
				</div>
					</div>

			</div>
</div>

<script type="text/javascript">
	$J( function() {
		$J('.badge_progress_task .quest_icon').v_tooltip( {'location':'bottom', 'tooltipClass': 'badge_task_tooltip', 'offsetY': 0, 'tooltipParent': null } );
	});
</script>

		</div>	<!-- responsive_page_legacy_content -->

			<div id="footer_spacer"></div>
	<div id="footer_responsive_optin_spacer"></div>
	<div id="footer">
		<div class="footer_content">
			<span id="footerLogo"><img src="https://steamcommunity-a.akamaihd.net/public/images/skin_1/footerLogo_valve.png?v=1" width="96" height="26" border="0" alt="Valve Logo" /></span>
			<span id="footerText">
				&copy; Valve Corporation. All rights reserved. All trademarks are property of their respective owners in the US and other countries.<br/>Some geospatial data on this website is provided by <a href="https://steamcommunity.com/linkfilter/?url=http://www.geonames.org" target="_blank" rel="noreferrer">geonames.org</a>.				<br>
									<span class="valve_links">
						<a href="http://store.steampowered.com/privacy_agreement/" target="_blank">Privacy Policy</a>
						&nbsp; | &nbsp;<a href="https://store.steampowered.com/legal/" target="_blank">Legal</a>
						&nbsp;| &nbsp;<a href="http://store.steampowered.com/subscriber_agreement/" target="_blank">Steam Subscriber Agreement</a>
					</span>
							</span>
		</div>
					<div class="responsive_optin_link">
				<div class="btn_medium btnv6_grey_black" onclick="Responsive_RequestMobileView()">
					<span>View mobile website</span>
				</div>
			</div>
			</div>
	<script type="text/javascript">g_rgDelayedLoadImages={"badge_images_gamebadge_582430_1_0":["https:\/\/steamcommunity-a.akamaihd.net\/economy\/image\/IzMF03bk9WpSBq-S-ekoE33L-iLqGFHVaU25ZzQNQcXdA3g5gMEPvUZZEaiHLrVJRsl8vGuCUY7Cjc9ehDNVzDMDcnCsjiQrcex4NM6b8AzrpKmiGj_ZbSCPAyjfGRhhEOIJYGWK_jKit-WcSmqfR-t9RQ0Me_ZR8zcYPJqJaUc01dNY8zPgxxR5S0YrPNVId0m5xWYXNK8awSwTIs5fzCSjJ5CP1AxnbUBuCbvhX-3EPtKkmHlwCRNhS_QZYIKS7HS-rcX1bOnGc68hIvw2NnrYan0\/98x115","https:\/\/steamcommunity-a.akamaihd.net\/economy\/image\/IzMF03bk9WpSBq-S-ekoE33L-iLqGFHVaU25ZzQNQcXdA3g5gMEPvUZZEaiHLrVJRsl8vGuCUY7Cjc9ehDNVzDMDcnCsjiQrcex4NM6b5R3ytam-CHv5bXHNIiDeGQM-SLtWMTmL9mHwsO6UFjCfQuwuSw4Fe_AB9m1PNJyOaRE1go4L_Dzg2VRzGVAqfddCdR2Ew3kSNrh4zXERdJ8EyHf1I5Ld1lxkYRdsC-vmXuqWO4ijxHsnWRNgS_FIMdmRvjuspsDnLPqHp-5JukI\/98x115","https:\/\/steamcommunity-a.akamaihd.net\/economy\/image\/IzMF03bk9WpSBq-S-ekoE33L-iLqGFHVaU25ZzQNQcXdA3g5gMEPvUZZEaiHLrVJRsl8vGuCUY7Cjc9ehDNVzDMDcnCsjiQrcex4NM6b7ADtpPDLFXn2bzKZfXLaGVptHLVbNm7R_GD3tr6VEGnKF-1_Rg4EKaYC92ZNNZiIbkRs05lLpWL-lUtvGhM6TcxLcQi-l3FDMuxxziARcJ5UnXfzIJ2Igw4xaU48DuzuUOiWbIWsl3t1D081G6YEJNXCrmPh-TftVy4v\/98x115","https:\/\/steamcommunity-a.akamaihd.net\/economy\/image\/IzMF03bk9WpSBq-S-ekoE33L-iLqGFHVaU25ZzQNQcXdA3g5gMEPvUZZEaiHLrVJRsl8vGuCUY7Cjc9ehDNVzDMDcnCsjiQrcex4NM6b6hD2seuDGz_DaTnPaSjUHVltQOZZMW3R-Dfz47nHRjvIRekrSw8MePABoWNAPZrfP0Q0hYQP-GbskkAzDhgvNMdJYgu-2EsaPLwizXwXdchTnXKhdZHcg1sxa0BjC762Bb3KOdXxmSlwCRljFqdONdnA6iHq5tevPeHAIPmLuC280Q\/98x115","https:\/\/steamcommunity-a.akamaihd.net\/economy\/image\/IzMF03bk9WpSBq-S-ekoE33L-iLqGFHVaU25ZzQNQcXdA3g5gMEPvUZZEaiHLrVJRsl8vGuCUY7Cjc9ehDNVzDMDcnCsjiQrcex4NM6b4gTps-eBWn36aTDBciWBGl8-HLAMY2qL-mCs7enGRD6bEr4oRghWKaUMpm0fOMqJPBU0hoEVu2u_0UZyDBItYPpPfQ68zykWYb50nCcTJp5XnyCjJZLQ1FkzO0diDOyzX7qWO4KhmShwDEgyTaQcesvL7zOq9ZbSzUdAGA\/98x115"],"badge_images_gamebadge_285800_1_0":["https:\/\/steamcommunity-a.akamaihd.net\/economy\/image\/IzMF03bk9WpSBq-S-ekoE33L-iLqGFHVaU25ZzQNQcXdA3g5gMEPvUZZEaiHLrVJRsl8vGuCUY7Cjc9ehDNVzDMEcnegjSQrcex4NM6b4gT1peuZDzL-ZTbDKnyAHVsxTrZXYz6M-zGm4OiVETHARO4oRFhQKKQF8DVKNc-JbRc50o9e5XW2kAJ_EQQsd9d5eQK6zXFOZO8mnScXdp5UnCXwL8fbglxqPEU7Xe6yX-nFZtWiwXstVEllTKgcNpXV5nL6vprwlmxQsL0\/98x115","https:\/\/steamcommunity-a.akamaihd.net\/economy\/image\/IzMF03bk9WpSBq-S-ekoE33L-iLqGFHVaU25ZzQNQcXdA3g5gMEPvUZZEaiHLrVJRsl8vGuCUY7Cjc9ehDNVzDMEcnegjSQrcex4NM6b4w3-pPCeWSamLj7JLibcQQk4SLVbZ2DdqjKl7e-QQW2cFb4uEAgMfqYNp2NANJrYOhU80NFZqDD2h0p6WBQnYMFDYjCyx3UUNOBwmiJHI85RnCL1J5TQ1l1la04-WengAOnLOoasxCh1CRNuTKJJbI3HpmWyr4G3Z_az11BFrw\/98x115","https:\/\/steamcommunity-a.akamaihd.net\/economy\/image\/IzMF03bk9WpSBq-S-ekoE33L-iLqGFHVaU25ZzQNQcXdA3g5gMEPvUZZEaiHLrVJRsl8vGuCUY7Cjc9ehDNVzDMEcnegjSQrcex4NM6b9gz3reOKGT_bYTHBaSjUHVltQOIMMzna_DL257ySEW6dQuh4EV8DdaQM8mZLbs_fP0E10oUPrzDoxR0zDhgvNMdJYgu-2EsaPLwizXxHd8hXz3HzI5LchF9rO0RtWbCzVe3FOdSsxSgtCR02S6kTN4nGsCO-5tevPeHAIPnhRtI5HQ\/98x115","https:\/\/steamcommunity-a.akamaihd.net\/economy\/image\/IzMF03bk9WpSBq-S-ekoE33L-iLqGFHVaU25ZzQNQcXdA3g5gMEPvUZZEaiHLrVJRsl8vGuCUY7Cjc9ehDNVzDMEcnegjSQrcex4NM6b6ADprqSEEXXwbWrHeCKMHwYwHuALZGnYrTKs4r7FEG3IR74sFVgEffBS8zYdPZyKNhVoysdVrCO6mFZ5GwQXe8hHdwrmnyYQZLsgm3REcJpSkHfyIZfR0VwzbxA_U-3gX-jFPtWsmXwmDhJhTb5aOtyD_ijt3Ul4ExM\/98x115","https:\/\/steamcommunity-a.akamaihd.net\/economy\/image\/IzMF03bk9WpSBq-S-ekoE33L-iLqGFHVaU25ZzQNQcXdA3g5gMEPvUZZEaiHLrVJRsl8vGuCUY7Cjc9ehDNVzDMEcnegjSQrcex4NM6b8xHpqOmIV1b2azyCJizYG1s1T7VfNm_Z_GKnt-uTSm7KQ-B6F1hWfPZV9WcaaMvYOkM-h9QD82DqlQptEBFucMpUdAqp9X0eMLoglXRAJp4EzCf1IJHYhVYxakFpUuzkB7uUOojwlyZwWkszFqlJZtidvnfyuMmmfLGLLA0SwHT4\/98x115"],"badge_images_gamebadge_292910_1_0":["https:\/\/steamcommunity-a.akamaihd.net\/economy\/image\/IzMF03bk9WpSBq-S-ekoE33L-iLqGFHVaU25ZzQNQcXdA3g5gMEPvUZZEaiHLrVJRsl8vGuCUY7Cjc9ehDNVzDMEc3ChjCQrcex4NM6b5gT2qO6UV1b4cjiBfXbKV3ZnCPALIzGEr2Tw6O-VQDjNR70pSl8ALqMF8WdPOM2BNxds1tRY_D3pwRcuSEJ-d8EVJAz12noUd78q2iUXN_QLxHWnc5nbh1tqPkU-WL2yULrHb9ekwSYtW09vSqhLYtmcuCHt_cWka_DQLqw_erFp-IORigfOfhekvg\/98x115","https:\/\/steamcommunity-a.akamaihd.net\/economy\/image\/IzMF03bk9WpSBq-S-ekoE33L-iLqGFHVaU25ZzQNQcXdA3g5gMEPvUZZEaiHLrVJRsl8vGuCUY7Cjc9ehDNVzDMEc3ChjCQrcex4NM6b9ArpseeJEz_TZzvUJyjXWldlHOQLODyKqzShtrvHQDmbQu14QQlSf6NSo2wca8qNPBE10IVf-GTgwhUqRk5mYstBNg202HAWI4IsxSAVIJZQmyD4cJeNh1o3bkBvWu7mB7XLadStxSd1W0huH6QbYdnAuSK6-8P5dLfYeu5xafBuOfFrLg\/98x115","https:\/\/steamcommunity-a.akamaihd.net\/economy\/image\/IzMF03bk9WpSBq-S-ekoE33L-iLqGFHVaU25ZzQNQcXdA3g5gMEPvUZZEaiHLrVJRsl8vGuCUY7Cjc9ehDNVzDMEc3ChjCQrcex4NM6b5Ar45-uAHXPyNWPFKXSNGl8xH7YPMGqN-mb07e2QSmnIQ756RgAAK_NXoGBNOsDYPBIjlNlc7We3hUB4DCkhf8RBdVLpmCBLN-4hmnQXc51XmXLxd53QgwpqPU47XOruVrjDatPwkShyXk5vAeBEM53TtSS0k4oxhA\/98x115","https:\/\/steamcommunity-a.akamaihd.net\/economy\/image\/IzMF03bk9WpSBq-S-ekoE33L-iLqGFHVaU25ZzQNQcXdA3g5gMEPvUZZEaiHLrVJRsl8vGuCUY7Cjc9ehDNVzDMEc3ChjCQrcex4NM6b4Rf8tPHLFXn2bzKZfyKJHw85HOBdYTnZ-jrxs-zBFjDBE-wuEQoCf6JS8WZLbMyMbRFv0ZlLpWL-lUtvGhM6TcxLcQi-lyZBZeUjmyVAcM5UnyHwcJWIjFZkPU4_UunhBLXCa4CgwnolWkxkS6gEJNXCrmPh-aEHFI01\/98x115","https:\/\/steamcommunity-a.akamaihd.net\/economy\/image\/IzMF03bk9WpSBq-S-ekoE33L-iLqGFHVaU25ZzQNQcXdA3g5gMEPvUZZEaiHLrVJRsl8vGuCUY7Cjc9ehDNVzDMEc3ChjCQrcex4NM6b9Ar1qKSEEXXwbWqUeXGOSgxtGbUPPW_RrDaht-WUEDDNRekqRgxVKKtQ8mEYPMvbbBE9ysdVrCO6mFZ5GwQXe8hHdwrmmCZHabt2zHNHIJ1UnCSmJ8XQjFk3YBNiC761X7zGboT3xS4jCxkzF75aOtyD_ijtvVcAIkA\/98x115"],"badge_images_gamebadge_220_1_0":["https:\/\/steamcommunity-a.akamaihd.net\/economy\/image\/IzMF03bk9WpSBq-S-ekoE33L-iLqGFHVaU25ZzQNQcXdA3g5gMEPvUZZEaiHLrVJRsl8vGuCUY7Cjc9ehDNVzDMEeHK-yX15aeAxCs7V0AzvpKSEEXXwbWrCeXmMHVhrSOVZYWDc9jT0s77HRTrKQLt6EgkBK_EF8zJIPp_YahY7ysdVrCO6mFZ5GwQXe8hHdwrmmyBLabkmkScRIJNTzyCjJseLhVkwPk4_Xbq1Ub_KOYikwXl2CRM0Hr5aOtyD_ijtKA43VF0\/98x115","https:\/\/steamcommunity-a.akamaihd.net\/economy\/image\/IzMF03bk9WpSBq-S-ekoE33L-iLqGFHVaU25ZzQNQcXdA3g5gMEPvUZZEaiHLrVJRsl8vGuCUY7Cjc9ehDNVzDMEeHK-yX15aeAxG8LS2U6q9qmgGWDlZzTLP2fQEV9vGL5bZmuP92Xz47mRFDvMR7ouFwpXfaQN9DJBb82IaxQ7gdZa8jHsx0F5UAYmdYNEfx2_z2YsOLAkzyRPdJ9akXCjL8KK0FdjPkI5Wuu1VrqQOYnwly12WhlvSakbNd3H7Cy_-YmxNKCQa_U2vRWFpZI\/98x115","https:\/\/steamcommunity-a.akamaihd.net\/economy\/image\/IzMF03bk9WpSBq-S-ekoE33L-iLqGFHVaU25ZzQNQcXdA3g5gMEPvUZZEaiHLrVJRsl8vGuCUY7Cjc9ehDNVzDMEeHK-yX15aeAxGcff2E7NoOyOGTL-ZTbDKnzdGAYwT-VYMTmM_2Km7OySE27KRrkvRAENL_EF-mdKO8iIPBo43NJe5XW2kAJ_EQQsd9d5eQK6zXFOYOl9kCURfM0BzCzxcJCKhQwwaEA4DLCyUb6QaIKtxiYlDEw1S6lJZZXV5nL6vprwl6Ty7VY\/98x115","https:\/\/steamcommunity-a.akamaihd.net\/economy\/image\/IzMF03bk9WpSBq-S-ekoE33L-iLqGFHVaU25ZzQNQcXdA3g5gMEPvUZZEaiHLrVJRsl8vGuCUY7Cjc9ehDNVzDMEeHK-yX15aeAxH4brwQu9qO-MG3GqO2KTdyeBTgg4RbJeNTvZrDuk5-2TEGzBEu19SghXevEN-mRJb8qPbAx9itAdqWqqk0FvIR8lc8JDLV7vkiwXMuQjyyRKdM1WyiSjdJTf1wlqPUFoCL_kXurLbtDzwnstDht5X_5Ncs2YucgxjNpD\/98x115","https:\/\/steamcommunity-a.akamaihd.net\/economy\/image\/IzMF03bk9WpSBq-S-ekoE33L-iLqGFHVaU25ZzQNQcXdA3g5gMEPvUZZEaiHLrVJRsl8vGuCUY7Cjc9ehDNVzDMEeHK-yX15aeAxH8TUxAr16sSfGXH6aTmCJizYG1s1GbRbMzncq2ag4LvBRmyYRe0uFgBVeKYG9zBBNZqMOEM9htFa8zHqwwptEBFucMpUdAqp9X0eMLoglXBGfZMGyi2mdcHRhAlmO0Y5CLjhBOrKOoanwignVUxuHvFMNt-c6yTyuMmmfLGLLNdprh3A\/98x115"],"badge_images_badge_13":["https:\/\/steamcommunity-a.akamaihd.net\/public\/images\/badges\/13_gamecollector\/25_80.png?v=4"],"badge_images_badge_1":["https:\/\/steamcommunity-a.akamaihd.net\/public\/images\/badges\/02_years\/steamyears1502_80.png"]};</script>
	</div>	<!-- responsive_page_content -->

</div>	<!-- responsive_page_frame -->
</body>
</html>`


GetBadgeInfo(data){

    const $ = cheerio.load(data);

    // test if we got badges
    let badgeSheet = $(".badges_sheet").html();


    let games = [];

    $(".badge_row").each(function () {
        // check for remaining cards
        let progress = $(this).find(".progress_info_bold").text();
        if (!progress) {
            return;
        }

        progress = Number(progress.replace(/[^0-9\.]+/g, ""));
        if (progress === 0) {
            return;
        }

        // Get play time
        let playTime = $(this).find(".badge_title_stats_playtime").text();
        if (!playTime) {
            return;
        }
        playTime = Number(playTime.replace(/[^0-9\.]+/g, ""));


        // Get game title
        $(this).find(".badge_view_details").remove();
        let gameTitle = $(this).find(".badge_title").text();
        if (!gameTitle) {
            return;
        }
        gameTitle = gameTitle.replace(/&nbsp;/g, '')
        gameTitle = gameTitle.trim();

        // Get appID
        let link = $(this).find(".badge_row_overlay").attr("href")
        link = link.substring(link.indexOf("gamecards"), link.length);
        let appId = Number(link.replace(/[^0-9\.]+/g, ""));

        let obj = {
            gameTitle: gameTitle,
            appId, appId,
            playTime: playTime,
            cardsRemaining: progress
        }

        games.push(obj)
    })
}





console.log(games)