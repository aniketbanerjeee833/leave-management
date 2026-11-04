import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    Menu,
    X,
    BarChart3,
    Home,
    QrCode,
    Mail,
    Package,
    Truck,
    Users,
    ChevronDown,
} from "lucide-react";

export default function Sidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    // const [openMenu, setOpenMenu] = useState(null);
    const location = useLocation();

    const isActive = (path) => location.pathname === path;
    console.log("Current path:", location.pathname);
    const [openMenus, setOpenMenus] = useState({
        home: false,
        qr: false,
        contactUs: false,
        ShipAndPurchase: false,
        RegisteredMember: false,
        product: false,
    });

    const toggleMenu = (menu) => {
        setOpenMenus((prev) => ({
            ...prev,
            [menu]: !prev[menu],
        }));
    };
    // const toggleMenu = (menu) => {
    //     setOpenMenu(openMenu === menu ? null : menu);
    // };
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setIsCollapsed(false); // expand on large screen
            } else {
                setIsCollapsed(true); // collapse on small screen
            }
        };

        handleResize(); // run once on load

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <>
            {/* Mobile overlay */}
            {!isCollapsed && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={() => setIsCollapsed(true)}
                />
            )}

            {/* <aside
                className={`fixed left-0 top-0 h-screen 
                    bg-gray-900 text-white transition-all duration-300 z-40 ${isCollapsed ? "w-20" : "w-64"
                    } lg:relative`}
            > */}
            <aside
                className={`fixed left-0 top-0 h-screen flex flex-col 
  bg-gray-900 text-white transition-all duration-300 z-40 
  ${isCollapsed ? "w-20" : "w-64"} lg:relative`}
            >
                {/* Header */}
                {/* <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
                    {!isCollapsed && <h1 className="font-bold text-lg">Admin</h1>}

                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-2 hover:bg-gray-700 rounded-lg lg:hidden"
                    >
                        {isCollapsed ? <Menu /> : <X />}
                    </button>
                </div> */}


                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-2 scrollbar-thin scrollbar-thumb-gray-700">
                    {/* <nav className="px-3 py-6 space-y-2"> */}
                    <div className=" ">

                        {/* Header */}
                        <div className="relative flex flex-col  items-center justify-center  px-4 py-4">

                            {/* Centered Title */}
                            <div className="flex justify-center py-1">
                                <img
                                    src="/assets/images/logo-tagway-new.png"
                                    className="w-20 object-contain"
                                    alt="logo"
                                />
                            </div>

                            <h1 className="font-semibold text-base text-center ">
                                Admin
                            </h1>


                            {/* Toggle Button (Right side absolute) */}
                            {/* <button
                            // onClick={() => setIsCollapsed(!isCollapsed)}
                            className="absolute right-4 p-2 hover:bg-gray-700 rounded-lg lg:hidden"
                        >
                            {isCollapsed ? <Menu size={18} /> : <X size={18} />}
                        </button> */}
                        </div>

                        {/* Logo below */}




                    </div>
                    {/* Dashboard */}
                    {/* <Link
                        to="/dashboard"
                        className={`flex items-center gap-3 px-3 py-1.5
                             rounded-lg ${isActive("/dashboard") ? " bg-red-500 text-white" : "hover:bg-gray-700"
                            }`}
                    >
                        <BarChart3 className="w-5 h-5" />
                        Dashboard
                        {!isCollapsed && "Dashboard"}
                    </Link> */}
                      <Link to="/dashboard"
                        className={`flex items-center gap-3 px-3 py-1.5
                             rounded-lg ${isActive("/dashboard") ? "bg-red-500 text-white" : "hover:bg-gray-700"
                            }`}
                    // className="flex items-center gap-3 px-3 py-1.5 hover:bg-gray-700 rounded-lg"
                    >
                        <BarChart3 className="w-5 h-5" />
                        {!isCollapsed && "Dashboard"}
                    </Link>
                    {/* <NavLink
                        to="/dashboard"
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-1.5 rounded-lg ${isActive
                                ? "bg-red-500 text-white"
                                : "hover:bg-gray-700 text-gray-300"
                            }`
                        }
                    >
                        <BarChart3 className="w-5 h-5" />
                        Dashboard
                    </NavLink> */}
                    <div className="border-t border-gray-700 my-3" />
                    {/* Home with submenu */}
                    <div>
                        <button
                            onClick={() => toggleMenu("home")}
                            className="w-full flex items-center 
                            justify-between px-3 py-1.5 rounded-lg hover:bg-gray-700"
                        >
                            <div className="flex items-center gap-3">
                                <Home className="w-5 h-5" />
                                {!isCollapsed && "Home"}
                            </div>

                            {!isCollapsed && (
                                <ChevronDown
                                    className={`transition-transform ${openMenus.home ? "rotate-180" : ""
                                        }`}
                                />
                            )}
                        </button>

                        {/* Submenu */}
                        {/* {openMenu === "home" && !isCollapsed && (
              <div className="ml-8 mt-2 space-y-2 flex flex-col">
                <Link
                 to="/home/slider">Slider Image</Link>
                <Link to="/home/tag-text">Tag Text</Link>
                <Link to="/home/how-it-works">How It Works</Link>
                <Link to="/home/how-it-works2">How It Works2</Link>
                <Link to="/home/customer-say">Customer Say</Link>
              </div>
            )} */}
                        {openMenus.home && !isCollapsed && (
                            <div className="ml-8 mt-2 flex flex-col">

                                <Link
                                    to="/home/slider"
                                    className="pb-2 border-b border-gray-700 hover:text-white"
                                >
                                    Slider Image
                                </Link>

                                <Link
                                    to="/home/tag-text"
                                    className="py-2 border-b border-gray-700 hover:text-white"
                                >
                                    Tag Text
                                </Link>

                                <Link
                                    to="/home/how-it-works"
                                    className="py-2 border-b border-gray-700 hover:text-white"
                                >
                                    How It Works
                                </Link>

                                <Link
                                    to="/home/how-it-works2"
                                    className="py-2 border-b border-gray-700 hover:text-white"
                                >
                                    How It Works2
                                </Link>

                                <Link
                                    to="/home/customer-says"
                                    className="py-2 hover:text-white"
                                >
                                    Customer Say
                                </Link>

                            </div>
                        )}
                    </div>
                    <div className="border-t border-gray-700 my-3" />
                    {/* Other menus */}
                    {/* <Link to="/QrCode/create-qr-code" className="flex items-center gap-3 px-3 py-1.5 hover:bg-gray-700 rounded-lg">
                        <QrCode className="w-5 h-5" />
                        {!isCollapsed && "QR Code"}
                    </Link> */}
                    <div>
                        {/* <button
                            onClick={() => toggleMenu("home")}
                            className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-gray-700"
                        >
                            <div className="flex items-center gap-3">
                                <Home className="w-5 h-5" />
                                {!isCollapsed && "Home"}
                            </div>

                            {!isCollapsed && (
                                <ChevronDown
                                    className={`transition-transform ${openMenu === "home" ? "rotate-180" : ""
                                        }`}
                                />
                            )}
                        </button> */}
                        <button
                            onClick={() => toggleMenu("qr")}
                            className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-gray-700"
                        >
                            <div className="flex items-center gap-3">
                                <QrCode className="w-5 h-5" />
                                {!isCollapsed && "QR Code"}
                            </div>

                            {!isCollapsed && (
                                <ChevronDown
                                    className={`transition-transform ${openMenus.qr ? "rotate-180" : ""
                                        }`}
                                />
                            )}
                        </button>

                        {/* Submenu */}
                        {/* {openMenu === "home" && !isCollapsed && (
              <div className="ml-8 mt-2 space-y-2 flex flex-col">
                <Link
                 to="/home/slider">Slider Image</Link>
                <Link to="/home/tag-text">Tag Text</Link>
                <Link to="/home/how-it-works">How It Works</Link>
                <Link to="/home/how-it-works2">How It Works2</Link>
                <Link to="/home/customer-say">Customer Say</Link>
              </div>
            )} */}
                        {openMenus.qr && !isCollapsed && (
                            <div className="ml-8 mt-2 flex flex-col">

                                <Link
                                    to="/qr-code/create"
                                    className="pb-2 border-b border-gray-700 hover:text-white"
                                >
                                    Create QR Code
                                </Link>

                                <Link
                                    to="/qr-code/print"
                                    className="py-2 border-b border-gray-700 hover:text-white"
                                >
                                    Print QR Code
                                </Link>

                                <Link
                                    to="/qr-code/one-year-delivered"
                                    className="py-2 border-b border-gray-700 hover:text-white"
                                >
                                    1 Year Delivered QR
                                </Link>

                                <Link
                                    to="/qr-code/six-months-delivered"
                                    className="py-2 border-b border-gray-700 hover:text-white"
                                >
                                    6 Month Delivered QR
                                </Link>

                                <Link
                                    to="/qr-code/three-months-delivered"
                                    className="py-2 hover:text-white"
                                >
                                    3 Month Delivered QR
                                </Link>

                            </div>
                        )}
                    </div>
                    <div className="border-t border-gray-700 my-3" />
                    <Link to="/contact-us/contact"
                        className={`flex items-center gap-3 px-3 py-1.5
                             rounded-lg ${isActive("/contact-us/contact") ? "bg-red-500 text-white" : "hover:bg-gray-700"
                            }`}
                    // className="flex items-center gap-3 px-3 py-1.5 hover:bg-gray-700 rounded-lg"
                    >
                        <Mail className="w-5 h-5" />
                        {!isCollapsed && "Contact"}
                    </Link>
                    {/* <div>
                        {/* <button
                            onClick={() => toggleMenu("home")}
                            className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-gray-700"
                        >
                            <div className="flex items-center gap-3">
                                <Home className="w-5 h-5" />
                                {!isCollapsed && "Home"}
                            </div>

                            {!isCollapsed && (
                                <ChevronDown
                                    className={`transition-transform ${openMenu === "home" ? "rotate-180" : ""
                                        }`}
                                />
                            )}
                        </button> 
                        <button
                            onClick={() => toggleMenu("contactUs")}
                            className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-gray-700"
                        >
                            <div className="flex items-center gap-3">
                                <Mail className="w-5 h-5" />
                                {!isCollapsed && "Contact Us"}
                            </div>

                            {!isCollapsed && (
                                <ChevronDown
                                    className={`transition-transform ${openMenus.contactUs ? "rotate-180" : ""
                                        }`}
                                />
                            )}
                        </button>

                        {/* Submenu */}
                    {/* {openMenu === "home" && !isCollapsed && (
              <div className="ml-8 mt-2 space-y-2 flex flex-col">
                <Link
                 to="/home/slider">Slider Image</Link>
                <Link to="/home/tag-text">Tag Text</Link>
                <Link to="/home/how-it-works">How It Works</Link>
                <Link to="/home/how-it-works2">How It Works2</Link>
                <Link to="/home/customer-say">Customer Say</Link>
              </div>
            )} 
                        {openMenus.contactUs && !isCollapsed && (
                            <div className="ml-8 mt-2 flex flex-col">

                                <Link
                                    to="/contact-us/contact"
                                    className="pb-2 border-b border-gray-700  hover:text-white"
                                >
                                    Contact Us
                                </Link>





                            </div>
                        )}
                    </div> */}
                    <div className="border-t border-gray-700 my-3" />
                    {/* <Link to="/dashboard/product" className="flex items-center gap-3 px-3 py-1.5 hover:bg-gray-700 rounded-lg">
                        <Package className="w-5 h-5" />
                        {!isCollapsed && "Product"}
                    </Link> */}
                    <div>
                        {/* <button
                            onClick={() => toggleMenu("home")}
                            className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-gray-700"
                        >
                            <div className="flex items-center gap-3">
                                <Home className="w-5 h-5" />
                                {!isCollapsed && "Home"}
                            </div>

                            {!isCollapsed && (
                                <ChevronDown
                                    className={`transition-transform ${openMenu === "home" ? "rotate-180" : ""
                                        }`}
                                />
                            )}
                        </button> */}
                        <button
                            onClick={() => toggleMenu("product")}
                            className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-gray-700"
                        >
                            <div className="flex items-center gap-3">
                                <Package className="w-5 h-5" />
                                {!isCollapsed && "Product"}
                            </div>

                            {!isCollapsed && (
                                <ChevronDown
                                    className={`transition-transform ${openMenus.product ? "rotate-180" : ""
                                        }`}
                                />
                            )}
                        </button>

                        {/* Submenu */}
                        {/* {openMenu === "home" && !isCollapsed && (
              <div className="ml-8 mt-2 space-y-2 flex flex-col">
                <Link
                 to="/home/slider">Slider Image</Link>
                <Link to="/home/tag-text">Tag Text</Link>
                <Link to="/home/how-it-works">How It Works</Link>
                <Link to="/home/how-it-works2">How It Works2</Link>
                <Link to="/home/customer-say">Customer Say</Link>
              </div>
            )} */}
                        {openMenus.product && !isCollapsed && (
                            <div className="ml-8 mt-2 flex flex-col">

                                <Link
                                    to="/product/details"
                                    className="pb-2 border-b border-gray-700 hover:text-white"
                                >
                                    Product Details
                                </Link>

                                <Link
                                    to="/product/discount-code"
                                    className="py-2 border-b border-gray-700 hover:text-white"
                                >
                                    Discount Code
                                </Link>

                                <Link
                                    to="/product/shipping-price"
                                    className="py-2  hover:text-white"
                                >
                                    Shipping Price
                                </Link>



                            </div>
                        )}
                    </div>
                    <div className="border-t border-gray-700 my-3" />
                    {/* <Link to="/dashboard/ship-purchase" className="flex items-center gap-3 px-3 py-1.5 hover:bg-gray-700 rounded-lg">
                        <Truck className="w-5 h-5" />
                        {!isCollapsed && "Ship & Purchase"}
                    </Link> */}
                    <button
                        onClick={() => toggleMenu("ShipAndPurchase")}
                        className="w-full flex items-center justify-between px-2 py-0.5 rounded-lg hover:bg-gray-700"
                    >
                        <div className="flex items-center gap-3">
                            <Truck className="w-5 h-5" />
                            {!isCollapsed && "Ship & Purchase"}
                        </div>

                        {!isCollapsed && (
                            <ChevronDown
                                className={`transition-transform ${openMenus.ShipAndPurchase ? "rotate-180" : ""
                                    }`}
                            />
                        )}
                    </button>

                    {/* Submenu */}
                    {/* {openMenu === "home" && !isCollapsed && (
              <div className="ml-8 mt-2 space-y-2 flex flex-col">
                <Link
                 to="/home/slider">Slider Image</Link>
                <Link to="/home/tag-text">Tag Text</Link>
                <Link to="/home/how-it-works">How It Works</Link>
                <Link to="/home/how-it-works2">How It Works2</Link>
                <Link to="/home/customer-say">Customer Say</Link>
              </div>
            )} */}
                    {openMenus.ShipAndPurchase && !isCollapsed && (
                        <div className="ml-8 mt-2 flex flex-col">

                            <Link
                                to="/ship-and-purchase/ship"
                                className="pb-2 border-b border-gray-700  hover:text-white"
                            >
                                Shipping Details
                            </Link>

                            <Link
                                to="/ship-and-purchase/purchase"
                                className="py-2  hover:text-white"
                            >
                                Purchase Details
                            </Link>




                        </div>
                    )}
                    <div className="border-t border-gray-700 my-3" />
                    {/* <Link to="/dashboard/registered-member" className="flex items-center gap-3 px-3 py-1.5 hover:bg-gray-700 rounded-lg">
                        <Users className="w-5 h-5" />
                        {!isCollapsed && "Registered Member"}
                    </Link> */}
                    <Link to="/registered-member"
                        className={`flex items-center gap-3 px-3 py-1.5
                             rounded-lg ${isActive("/registered-member") ? "bg-red-500 text-white" : "hover:bg-gray-700"
                            }`}
                    // className="flex items-center gap-3 px-3 py-1.5 hover:bg-gray-700 rounded-lg"
                    >
                        <Users className="w-5 h-5" />
                        {!isCollapsed && "RegisteredMember"}
                    </Link>
                    {/* <button
                        onClick={() => toggleMenu("RegisteredMember")}
                        className="w-full flex items-center justify-between 
                        px-3 py-1.5 rounded-lg hover:bg-gray-700"
                    >
                        <div className="flex items-center gap-3">
                            <Truck className="w-5 h-5" />
                            {!isCollapsed && "Registered Member"}
                        </div>

                        {!isCollapsed && (
                            <ChevronDown
                                className={`transition-transform ${openMenus.RegisteredMember ? "rotate-180" : ""
                                    }`}
                            />
                        )}
                    </button> */}

                    {/* Submenu */}
                    {/* {openMenu === "home" && !isCollapsed && (
              <div className="ml-8 mt-2 space-y-2 flex flex-col">
                <Link
                 to="/home/slider">Slider Image</Link>
                <Link to="/home/tag-text">Tag Text</Link>
                <Link to="/home/how-it-works">How It Works</Link>
                <Link to="/home/how-it-works2">How It Works2</Link>
                <Link to="/home/customer-say">Customer Say</Link>
              </div>
            )} */}
                    {/* {openMenus.RegisteredMember && !isCollapsed && (
                        <div className="ml-8 mt-2 flex flex-col">

                            <Link
                                to="/registered-member/registered-member"
                                className="pb-2 border-b border-gray-700  hover:text-white"
                            >
                                Registered Member
                            </Link>






                        </div>
                    )} */}
                    <div className="border-t border-gray-700 my-3" />
                </nav>
            </aside>
        </>
    );
}