<%@ Page Language="C#" AutoEventWireup="true" %>
<asp:GridView ID="GridView1" runat="server" 
    AutoGenerateColumns="False" 
    OnRowDataBound="GridView1_RowDataBound">
    <Columns>
        <asp:BoundField DataField="CustomerId" HeaderText="ID" />
        <asp:BoundField DataField="CustomerName" HeaderText="Name" />
        <asp:BoundField DataField="Email" HeaderText="Email" />
    </Columns>
</asp:GridView>

<asp:TextBox ID="TxtName" runat="server" />
<asp:Button ID="BtnSave" runat="server" Text="Save" OnClick="BtnSave_Click" />