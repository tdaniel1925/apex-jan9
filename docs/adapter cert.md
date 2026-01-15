
Pagination
Pagination in Search Request
Step 1: Hit the request with the highlighted attributes. Here we keep pagesize=500 as there are more than 24000 records.
	<search searchid="" total="true" pagesize="500">
Step 2: Response will give more=”true” as below along with the searchid.
<search user="ADMIN" office="GLIC" page="0" more="true" pagesize="500" searchid="MQ==" total="24181">
Step 3: Since response have more=”true”, it means there are more records and since current response is having only 500 records we need to use the searchid from response i.e. searchid="MQ==" in next request to get next 500 records. 
Use search attributes as:
 <search searchid="MQ==" total="true" pagesize="500">
Response should be as below:
<search user="ADMIN" office="GLIC" page="-1" more="true" pagesize="300" searchid="MQ==" total="24181">
Note: searchid can be anything as it is system generated and can be changed on run time, we have used searchid=”MQ==” as example.
 Step 4: Repeat Step 3 till more=”false” is not received in response.
<search user="ADMIN" office="GLIC" page="-1" more="false" pagesize="300" searchid="" total="0">





<request version='1.0'>
    <header>
        <office> </office>
        <user> </user>
        <password> </password>
    </header>
    <search>
        <object>
            <Contact>
	            <LastName/>
	            <FirstName/>
            </Contact>
        </object>
        <condition>
	        <expr prop='LastName' op='starts'>
		        <v>A</v>
	        </expr>
        </condition>
    </search>
</request>
