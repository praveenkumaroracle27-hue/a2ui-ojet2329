<%@ page language="java" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>

<table border="1">
  <tr>
    <th>ID</th><th>Name</th><th>Email</th>
  </tr>
  <c:forEach var="customer" items="${customers}">
    <tr>
      <td>${customer.id}</td>
      <td>${customer.name}</td>
      <td>${customer.email}</td>
    </tr>
  </c:forEach>
</table>

<form action="customerSave" method="POST">
  <input type="text" name="name" placeholder="Customer Name" />
  <input type="submit" value="Save" />
</form>