using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class CustomerController : ControllerBase
{
    private readonly ICustomerService _service;
    
    public CustomerController(ICustomerService service)
    {
        _service = service;
    }
    
    [HttpGet]
    public IActionResult GetAllCustomers()
    {
        var customers = _service.GetAllCustomers();
        return Ok(new { customers });
    }
    
    [HttpPost]
    public IActionResult SaveCustomer([FromBody] Customer customer)
    {
        _service.SaveCustomer(customer);
        return Ok(new { success = true });
    }
}