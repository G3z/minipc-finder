# Data source

The catalog is downloaded from the public Google Sheet using:

`https://docs.google.com/spreadsheets/d/1SWqLJ6tGmYHzqGaa4RZs54iw7C1uLcTU_rLTRHTOzaA/export?format=csv&gid=239063037`

The endpoint responds with a redirect to a Google download host. The ETL follows it and rejects HTML responses, which would indicate an authentication or access failure. The sheet name is checked through the public document metadata before the CSV is parsed; CSV itself does not contain the tab name.
