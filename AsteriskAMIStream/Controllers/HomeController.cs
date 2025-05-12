using Microsoft.AspNetCore.Mvc;

namespace AsteriskAMIStream.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
