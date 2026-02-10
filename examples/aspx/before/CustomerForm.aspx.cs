using System;
using System.Web.UI;

public partial class CustomerForm : Page
{
    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {
            LoadCustomers();
        }
    }
    
    private void LoadCustomers()
    {
        var customers = _customerService.GetAllCustomers();
        GridView1.DataSource = customers;
        GridView1.DataBind();
    }
    
    protected void BtnSave_Click(object sender, EventArgs e)
    {
        var customer = new Customer { Name = TxtName.Text };
        _customerService.SaveCustomer(customer);
    }
}